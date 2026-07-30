import { App, Modal, Notice, Platform, Plugin, PluginSettingTab, Setting } from "obsidian";
import { INotelertPlugin } from "../core/plugin-interface";
import { SUPPORTED_LANGUAGES, getTranslation } from "../i18n";
import { createDiv, createEl } from "../core/dom";
import {
  requestEmailVerification,
  verifyNotificationEmail,
} from "../features/notifications/email-verification-api";
import {
  clearPremiumStatus,
  getCachedPremiumStatus,
  getPremiumStatus,
  PremiumStatus,
} from "../features/premium/premium-service";
import { createStripeCheckout, createStripePortal } from "../features/premium/billing-api";
import {
  AccountAction,
  AccountSummary,
  confirmAccountAction,
  getAccountSummary,
  requestAccountAction,
  revokeCurrentInstallation,
} from "../features/account/account-api";
import {
  NOTELERT_DELETE_ACCOUNT_URL,
  NOTELERT_PRIVACY_URL,
  NOTELERT_TERMS_URL,
} from "../core/config";

const CONTACT_EMAIL = "notelert@proton.me";
const CONTACT_MAILTO_URL = `mailto:${CONTACT_EMAIL}?subject=Notelert%20Contact%20%26%20feedback`;

// Obsidian's runtime supports getSettingDefinitions(), but the generated type
// definitions still model PluginSettingTab as abstract.
const PluginSettingTabBase = PluginSettingTab as unknown as new (
  app: App,
  plugin: Plugin & INotelertPlugin
) => PluginSettingTab;

export class NotelertSettingTab extends PluginSettingTabBase {
  plugin: INotelertPlugin;
  private readonly bannerDismissedKey = "notelert-app-required-banner-dismissed";
  private candidateEmail = "";
  private verificationCode = "";
  private isEditingNotificationEmail = false;
  private isSendingVerificationCode = false;
  private isVerifyingEmailCode = false;
  private isRefreshingPlanStatus = false;
  private isOpeningBilling = false;
  private checkoutStatusPollId = 0;
  private accountSummary: AccountSummary | null = null;
  private accountSummaryToken = "";
  private isLoadingAccountSummary = false;
  private accountAction: AccountAction | null = null;
  private accountActionVerificationId = "";
  private accountActionCode = "";
  private accountDeletionConfirmation = "";
  private isRequestingAccountAction = false;
  private isConfirmingAccountAction = false;
  private isRevokingInstallation = false;
  private isAccountPrivacyExpanded = false;

  constructor(app: App, plugin: Plugin & INotelertPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private hasPluginToken(): boolean {
    return !!this.plugin.settings.pluginToken?.trim();
  }

  private shouldShowAppRequiredBanner(): boolean {
    return false;
  }

  display(): void {
    this.render();
  }

  private render(): void {
    const { containerEl } = this;
    containerEl.empty();

    const language = this.plugin.settings.language;

    if (this.shouldShowAppRequiredBanner()) {
      this.renderLegacyBanner(containerEl, language);
    }

    this.renderLegacySection(containerEl, getTranslation(language, "settings.basicSettings"));
    new Setting(containerEl)
      .setName(getTranslation(language, "settings.language"))
      .setDesc(getTranslation(language, "settings.languageDesc"))
      .addDropdown((dropdown) => {
        SUPPORTED_LANGUAGES.forEach((lang) => {
          dropdown.addOption(lang.code, `${lang.nativeName} (${lang.name})`);
        });
        dropdown.setValue(this.plugin.settings.language);
        dropdown.onChange((value) => {
          void (async () => {
            this.plugin.settings.language = value;
            await this.plugin.saveSettings();
            this.render();
          })();
        });
      });

    this.renderNotificationEmailSettings(containerEl, language);
    this.renderPlanAndEmailUsage(containerEl, language);
    this.renderDeliveryModeSettings(containerEl, language);
    void this.refreshPlanStatus();

    this.renderLegacySection(containerEl, getTranslation(language, "settings.pluginToken.title"));
    let pluginTokenInput: HTMLInputElement | null = null;
    new Setting(containerEl)
      .setName(getTranslation(language, "settings.pluginToken.title"))
      .setDesc(
        getTranslation(language, "settings.pluginToken.descDesktop") ||
          "Token que vincula el plugin con la app para poder usar las notificaciones."
      )
      .addText((text) => {
        text
          .setPlaceholder(getTranslation(language, "settings.pluginToken.placeholder"))
          .setValue(this.plugin.settings.pluginToken || "")
          .inputEl.type = "password";
        pluginTokenInput = text.inputEl;
        text.onChange((value) => {
          void (async () => {
            this.plugin.settings.pluginToken = value.trim();
            this.app.saveLocalStorage(this.bannerDismissedKey, null);
            await this.plugin.saveSettings();
            this.render();
          })();
        });
      })
      .addButton((button) => {
        button
          .setButtonText(getTranslation(language, "settings.pluginToken.showHide"))
          .onClick(() => {
            if (pluginTokenInput) {
              pluginTokenInput.type = pluginTokenInput.type === "password" ? "text" : "password";
            }
          });
      });

    this.renderLegacySection(containerEl, getTranslation(language, "settings.generalSettings.title"));
    new Setting(containerEl)
      .setName(getTranslation(language, "settings.generalSettings.datePickerTriggerTitle"))
      .setDesc(getTranslation(language, "settings.generalSettings.datePickerTriggerDesc"))
      .addText((text) => {
        text
          .setPlaceholder(":@")
          .setValue(this.plugin.settings.datePickerTrigger || ":@")
          .onChange((value) => {
            void (async () => {
              this.plugin.settings.datePickerTrigger = value.trim() || ":@";
              await this.plugin.saveSettings();
            })();
          });
      });

    this.renderLegacySection(
      containerEl,
      getTranslation(language, "settings.contactFeedback.title") || "Contact & feedback"
    );
    new Setting(containerEl)
      .setName(getTranslation(language, "settings.contactFeedback.title") || "Contact & feedback")
      .setDesc(
        getTranslation(language, "settings.contactFeedback.desc", { email: CONTACT_EMAIL }) ||
          `Questions, issues, or suggestions: ${CONTACT_EMAIL}`
      )
      .addButton((button) => {
        button
          .setButtonText(getTranslation(language, "settings.contactFeedback.button") || "Email")
          .onClick(() => {
            window.open(CONTACT_MAILTO_URL);
          });
      });

    this.renderAccountAndPrivacy(containerEl, language);
    void this.refreshAccountSummary();
  }

  private renderAccountAndPrivacy(containerEl: HTMLElement, language: string): void {
    const details = createEl(containerEl, "details", {
      cls: "notelert-account-privacy",
    });
    details.open = this.isAccountPrivacyExpanded || this.accountAction !== null;
    details.addEventListener("toggle", () => {
      this.isAccountPrivacyExpanded = details.open;
    });

    const summary = createEl(details, "summary", {
      cls: "notelert-account-privacy-summary",
    });
    createEl(summary, "span", {
      cls: "notelert-account-privacy-title",
      text: getTranslation(language, "settings.accountPrivacy.title"),
    });
    createEl(summary, "span", {
      cls: "notelert-account-privacy-hint",
      text: getTranslation(language, "settings.accountPrivacy.collapsedDesc"),
    });

    const contentEl = createDiv(details, {
      cls: "notelert-account-privacy-content",
    });

    const summaryDescription = this.accountSummary
      ? getTranslation(language, "settings.accountPrivacy.summary", {
          email: this.accountSummary.notificationEmail || this.accountSummary.email || "—",
          installations: this.accountSummary.activePluginInstallations,
          reminders: this.accountSummary.scheduledEmailReminders + this.accountSummary.scheduledPushReminders,
        })
      : this.hasPluginToken()
        ? getTranslation(language, "settings.accountPrivacy.loading")
        : getTranslation(language, "settings.accountPrivacy.noAccount");

    new Setting(contentEl)
      .setName(getTranslation(language, "settings.accountPrivacy.account"))
      .setDesc(summaryDescription);

    new Setting(contentEl)
      .setName(getTranslation(language, "settings.accountPrivacy.legal"))
      .setDesc(getTranslation(language, "settings.accountPrivacy.legalDesc"))
      .addButton((button) => button
        .setButtonText(getTranslation(language, "settings.accountPrivacy.privacy"))
        .onClick(() => window.open(NOTELERT_PRIVACY_URL)))
      .addButton((button) => button
        .setButtonText(getTranslation(language, "settings.accountPrivacy.terms"))
        .onClick(() => window.open(NOTELERT_TERMS_URL)))
      .addButton((button) => button
        .setButtonText(getTranslation(language, "settings.accountPrivacy.webDeletion"))
        .onClick(() => window.open(NOTELERT_DELETE_ACCOUNT_URL)));

    if (!this.hasPluginToken()) return;

    new Setting(contentEl)
      .setName(getTranslation(language, "settings.accountPrivacy.export"))
      .setDesc(getTranslation(language, "settings.accountPrivacy.exportDesc"))
      .addButton((button) => {
        button
          .setButtonText(getTranslation(language, "settings.accountPrivacy.requestExport"))
          .setDisabled(this.isRequestingAccountAction || this.isConfirmingAccountAction)
          .onClick(() => void this.beginAccountAction("export", language));
        this.renderButtonLoading(
          button.buttonEl,
          this.isRequestingAccountAction && this.accountAction === "export",
          getTranslation(language, "settings.accountPrivacy.requestExport")
        );
      });

    new Setting(contentEl)
      .setName(getTranslation(language, "settings.accountPrivacy.revoke"))
      .setDesc(getTranslation(language, "settings.accountPrivacy.revokeDesc"))
      .addButton((button) => {
        button
          .setButtonText(getTranslation(language, "settings.accountPrivacy.revokeButton"))
          .setDisabled(this.isRevokingInstallation)
          .onClick(() => void this.revokeInstallation(language));
        this.renderButtonLoading(
          button.buttonEl,
          this.isRevokingInstallation,
          getTranslation(language, "settings.accountPrivacy.revokeButton")
        );
      });

    const deleteSetting = new Setting(contentEl)
      .setName(getTranslation(language, "settings.accountPrivacy.delete"))
      .setDesc(getTranslation(language, "settings.accountPrivacy.deleteDesc"))
      .addButton((button) => {
        button
          .setButtonText(getTranslation(language, "settings.accountPrivacy.requestDelete"))
          .setDisabled(this.isRequestingAccountAction || this.isConfirmingAccountAction)
          .onClick(() => void this.beginAccountAction("delete", language));
        button.buttonEl.addClass("mod-warning");
        this.renderButtonLoading(
          button.buttonEl,
          this.isRequestingAccountAction && this.accountAction === "delete",
          getTranslation(language, "settings.accountPrivacy.requestDelete")
        );
      });
    deleteSetting.settingEl.addClass("notelert-danger-setting");

    if (this.accountAction && this.accountActionVerificationId) {
      this.renderAccountActionConfirmation(contentEl, language);
    }
  }

  private renderAccountActionConfirmation(containerEl: HTMLElement, language: string): void {
    const isDelete = this.accountAction === "delete";
    let refreshConfirmButton: (() => void) | undefined;
    const codeSetting = new Setting(containerEl)
      .setName(getTranslation(language, "settings.accountPrivacy.securityCode"))
      .setDesc(getTranslation(language, "settings.accountPrivacy.securityCodeDesc"))
      .addText((text) => text
        .setPlaceholder("000000")
        .setValue(this.accountActionCode)
        .setDisabled(this.isConfirmingAccountAction)
        .onChange((value) => {
          this.accountActionCode = value.replace(/\D/g, "").slice(0, 6);
          text.setValue(this.accountActionCode);
          refreshConfirmButton?.();
        }));
    codeSetting.settingEl.addClass("notelert-sensitive-action");

    if (isDelete) {
      new Setting(containerEl)
        .setName(getTranslation(language, "settings.accountPrivacy.typeDelete"))
        .setDesc(getTranslation(language, "settings.accountPrivacy.typeDeleteDesc"))
        .addText((text) => text
          .setPlaceholder(getTranslation(language, "settings.accountPrivacy.deleteWord"))
          .setValue(this.accountDeletionConfirmation)
          .setDisabled(this.isConfirmingAccountAction)
          .onChange((value) => {
            this.accountDeletionConfirmation = value.trim();
            refreshConfirmButton?.();
          }));
    }

    new Setting(containerEl)
      .setName(getTranslation(
        language,
        isDelete ? "settings.accountPrivacy.finalDelete" : "settings.accountPrivacy.finalExport"
      ))
      .addButton((button) => {
        const update = () => {
          button.setDisabled(
            this.isConfirmingAccountAction ||
            !/^\d{6}$/.test(this.accountActionCode) ||
            (isDelete && this.accountDeletionConfirmation.toUpperCase() !==
              getTranslation(language, "settings.accountPrivacy.deleteWord").toUpperCase())
          );
        };
        update();
        refreshConfirmButton = update;
        button
          .setButtonText(getTranslation(
            language,
            isDelete ? "settings.accountPrivacy.confirmDelete" : "settings.accountPrivacy.confirmExport"
          ))
          .onClick(() => void this.confirmSensitiveAccountAction(language));
        if (isDelete) button.buttonEl.addClass("mod-warning");
        this.renderButtonLoading(
          button.buttonEl,
          this.isConfirmingAccountAction,
          getTranslation(
            language,
            isDelete ? "settings.accountPrivacy.confirmDelete" : "settings.accountPrivacy.confirmExport"
          )
        );
      })
      .addButton((button) => button
        .setButtonText(getTranslation(language, "settings.accountPrivacy.cancel"))
        .setDisabled(this.isConfirmingAccountAction)
        .onClick(() => {
          this.resetAccountAction();
          this.render();
        }));
  }

  private async refreshAccountSummary(): Promise<void> {
    const token = this.plugin.settings.pluginToken?.trim() || "";
    if (!token || this.isLoadingAccountSummary || this.accountSummaryToken === token) return;
    this.isLoadingAccountSummary = true;
    try {
      this.accountSummary = await getAccountSummary(token);
      this.accountSummaryToken = token;
      this.render();
    } catch (error) {
      this.plugin.log(`No se pudo cargar el resumen de cuenta: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.isLoadingAccountSummary = false;
    }
  }

  private async beginAccountAction(action: AccountAction, language: string): Promise<void> {
    this.accountAction = action;
    this.isRequestingAccountAction = true;
    this.render();
    try {
      const result = await requestAccountAction({
        pluginToken: this.plugin.settings.pluginToken || "",
        installationId: this.plugin.settings.pluginInstallationId,
        action,
      });
      this.accountActionVerificationId = result.verificationId;
      this.accountActionCode = "";
      this.accountDeletionConfirmation = "";
      new Notice(getTranslation(language, "settings.accountPrivacy.codeSent"), 10000);
    } catch (error) {
      this.resetAccountAction();
      new Notice(error instanceof Error ? error.message : String(error), 10000);
    } finally {
      this.isRequestingAccountAction = false;
      this.render();
    }
  }

  private async confirmSensitiveAccountAction(language: string): Promise<void> {
    if (!this.accountAction || !this.accountActionVerificationId) return;
    const action = this.accountAction;
    this.isConfirmingAccountAction = true;
    this.render();
    try {
      const result = await confirmAccountAction<Record<string, unknown>>({
        pluginToken: this.plugin.settings.pluginToken || "",
        installationId: this.plugin.settings.pluginInstallationId,
        action,
        verificationId: this.accountActionVerificationId,
        code: this.accountActionCode,
        ...(action === "delete" ? { confirmation: "DELETE" as const } : {}),
      });
      if (action === "export" && result.data) {
        const fileName = await this.writeAccountExport(result.data);
        new Notice(getTranslation(language, "settings.accountPrivacy.exported", { file: fileName }), 12000);
      } else if (action === "delete") {
        await this.clearLocalAccountState();
        new Notice(getTranslation(language, "settings.accountPrivacy.deleted"), 12000);
      }
      this.resetAccountAction();
    } catch (error) {
      new Notice(error instanceof Error ? error.message : String(error), 10000);
    } finally {
      this.isConfirmingAccountAction = false;
      this.render();
    }
  }

  private async writeAccountExport(data: Record<string, unknown>): Promise<string> {
    const date = new Date().toISOString().replace(/[:.]/g, "-");
    let fileName = `Notelert-data-export-${date}.json`;
    let suffix = 1;
    while (this.app.vault.getAbstractFileByPath(fileName)) {
      fileName = `Notelert-data-export-${date}-${suffix}.json`;
      suffix += 1;
    }
    await this.app.vault.create(fileName, JSON.stringify(data, null, 2));
    return fileName;
  }

  private revokeInstallation(language: string): void {
    new RevokeInstallationModal(
      this.app,
      getTranslation(language, "settings.accountPrivacy.revokeConfirm"),
      () => void this.performRevokeInstallation(language)
    ).open();
  }

  private async performRevokeInstallation(language: string): Promise<void> {
    this.isRevokingInstallation = true;
    this.render();
    try {
      await revokeCurrentInstallation(this.plugin.settings.pluginToken || "");
      await this.clearLocalAccountState();
      new Notice(getTranslation(language, "settings.accountPrivacy.revoked"), 10000);
    } catch (error) {
      new Notice(error instanceof Error ? error.message : String(error), 10000);
    } finally {
      this.isRevokingInstallation = false;
      this.render();
    }
  }

  private async clearLocalAccountState(): Promise<void> {
    clearPremiumStatus();
    this.plugin.settings.pluginToken = "";
    this.plugin.settings.userId = "";
    this.plugin.settings.userEmail = "";
    this.plugin.settings.notificationEmail = "";
    this.plugin.settings.notificationEmailStatus = "missing";
    this.plugin.settings.pendingNotificationEmail = "";
    this.plugin.settings.emailVerificationId = "";
    this.plugin.settings.emailVerificationExpiresAt = "";
    this.plugin.settings.hasActivePushDevice = undefined;
    this.plugin.settings.deliveryMode = "push";
    this.plugin.settings.scheduledEmails = [];
    this.accountSummary = null;
    this.accountSummaryToken = "";
    await this.plugin.saveSettings();
  }

  private resetAccountAction(): void {
    this.accountAction = null;
    this.accountActionVerificationId = "";
    this.accountActionCode = "";
    this.accountDeletionConfirmation = "";
  }

  private renderPlanAndEmailUsage(containerEl: HTMLElement, language: string): void {
    const status = getCachedPremiumStatus();
    const card = createDiv(containerEl, { cls: "notelert-plan-card" });
    const header = createDiv(card, { cls: "notelert-plan-header" });
    createEl(header, "span", {
      text: getTranslation(language, "settings.emailPlan.title"),
      cls: "notelert-plan-title",
    });

    const isTrial = status.plan === "trial" || status.source === "trial";
    const isPremium = status.isPremium;
    if (isPremium) {
      const badge = createEl(header, "span", {
        text: getTranslation(
          language,
          isTrial ? "settings.emailPlan.trialLabel" : "settings.emailPlan.premiumLabel"
        ),
        cls: "notelert-plan-badge is-premium",
      });
      badge.setAttribute("aria-label", badge.textContent || "");
    }

    const usage = status.emailUsage;
    if (status.loading && !usage) {
      createDiv(card, {
        text: getTranslation(language, "settings.emailPlan.loading"),
        cls: "notelert-plan-description",
      });
      return;
    }

    if (!usage) {
      createDiv(card, {
        text: getTranslation(language, "settings.emailPlan.connect"),
        cls: "notelert-plan-description",
      });
      return;
    }

    createDiv(card, {
      text: getTranslation(
        language,
        isPremium ? "settings.emailPlan.counter" : "settings.emailPlan.counterFree",
        {
        used: String(usage.used),
        limit: String(usage.limit),
        }
      ),
      cls: "notelert-email-counter",
    });

    const progress = createDiv(card, { cls: "notelert-email-progress" });
    const progressValue = createDiv(progress, { cls: "notelert-email-progress-value" });
    const percentage = usage.limit > 0 ? Math.min((usage.used / usage.limit) * 100, 100) : 0;
    progressValue.style.width = `${percentage}%`;
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", String(usage.limit));
    progress.setAttribute("aria-valuenow", String(usage.used));

    if (!this.hasPluginToken()) return;

    if (status.hasStripeBilling || status.source === "stripe") {
      createDiv(card, {
        text: getTranslation(language, "settings.emailPlan.premiumDescription"),
        cls: "notelert-plan-description",
      });
      const actions = createDiv(card, { cls: "notelert-plan-actions" });
      const manageButton = createEl(actions, "button", {
        text: getTranslation(language, "settings.emailPlan.manageBilling"),
      });
      manageButton.disabled = this.isOpeningBilling;
      manageButton.addEventListener("click", () => void this.openStripePortal());
      this.renderButtonLoading(
        manageButton,
        this.isOpeningBilling,
        getTranslation(language, "settings.emailPlan.manageBilling")
      );
    } else if (!status.isPremium || status.source === "trial") {
      const upgradeDetails = createEl(card, "details", { cls: "notelert-plan-upgrade" });
      createEl(upgradeDetails, "summary", {
        text: getTranslation(language, "settings.emailPlan.getMoreReminders"),
      });
      const upgradeContent = createDiv(upgradeDetails, { cls: "notelert-plan-upgrade-content" });
      createDiv(upgradeContent, {
        text: getTranslation(
          language,
          isTrial ? "settings.emailPlan.trialDescription" : "settings.emailPlan.freeDescription"
        ),
        cls: "notelert-plan-description",
      });
      const actions = createDiv(upgradeContent, { cls: "notelert-plan-actions" });
      const monthlyLabel = getTranslation(language, "settings.emailPlan.upgradeMonthly");
      const yearlyLabel = getTranslation(language, "settings.emailPlan.upgradeYearly");
      const actionWidth = this.measurePlanActionWidth([monthlyLabel, yearlyLabel]);
      const monthlyButton = createEl(actions, "button", {
        text: monthlyLabel,
      });
      monthlyButton.addClass("mod-cta", "notelert-plan-action-button");
      monthlyButton.style.width = actionWidth;
      monthlyButton.disabled = this.isOpeningBilling;
      monthlyButton.addEventListener("click", () => void this.openStripeCheckout("monthly"));
      this.renderButtonLoading(
        monthlyButton,
        this.isOpeningBilling,
        monthlyLabel
      );

      const yearlyButton = createEl(actions, "button", {
        text: yearlyLabel,
      });
      yearlyButton.addClass("notelert-plan-action-button");
      yearlyButton.style.width = actionWidth;
      yearlyButton.disabled = this.isOpeningBilling;
      yearlyButton.addEventListener("click", () => void this.openStripeCheckout("yearly"));
      this.renderButtonLoading(
        yearlyButton,
        this.isOpeningBilling,
        yearlyLabel
      );
    } else {
      createDiv(card, {
        text: getTranslation(language, "settings.emailPlan.premiumDescription"),
        cls: "notelert-plan-description",
      });
    }
  }

  /** Measures both localized labels before a loading state replaces them. */
  private measurePlanActionWidth(labels: string[]): string {
    const widths = labels.map((label) => {
      const measure = createEl(document.body, "button", { text: label });
      measure.addClass("notelert-plan-action-button", "notelert-plan-action-measure");
      const width = Math.ceil(measure.getBoundingClientRect().width);
      measure.remove();
      return width;
    });
    return `${Math.max(...widths)}px`;
  }

  private async openStripeCheckout(period: "monthly" | "yearly"): Promise<void> {
    // Android hands an about:blank tab to its external browser but doesn't let
    // the Obsidian webview navigate it afterwards. Pre-open only on desktop;
    // mobile keeps a visible in-plugin spinner until Stripe returns the URL.
    const checkoutWindow = Platform.isMobile ? null : window.open("about:blank", "_blank");
    this.isOpeningBilling = true;
    this.render();
    try {
      const url = await createStripeCheckout(
        this.plugin.settings.pluginToken || "",
        period,
        this.plugin.settings.language,
        this.app.vault.getName()
      );
      if (checkoutWindow && !checkoutWindow.closed) {
        checkoutWindow.location.href = url;
      } else {
        window.open(url, "_blank");
      }
      this.startCheckoutStatusPolling();
    } catch (error) {
      checkoutWindow?.close();
      new Notice(error instanceof Error ? error.message : String(error), 10000);
    } finally {
      this.isOpeningBilling = false;
      this.render();
    }
  }

  /** Keeps the entitlement UI fresh while Stripe confirms Checkout by webhook. */
  private startCheckoutStatusPolling(): void {
    const pollId = ++this.checkoutStatusPollId;
    window.setTimeout(() => void this.pollCheckoutStatus(pollId, 45), 1500);
  }

  private async pollCheckoutStatus(pollId: number, attemptsRemaining: number): Promise<void> {
    if (pollId !== this.checkoutStatusPollId || attemptsRemaining <= 0) return;

    const token = this.plugin.settings.pluginToken?.trim();
    if (!token) return;

    const before = this.planStatusKey(getCachedPremiumStatus());
    this.isRefreshingPlanStatus = true;
    try {
      const status = await getPremiumStatus(token, true);
      if (this.planStatusKey(status) !== before) this.render();

      const premiumUsageReady = status.isPremium
        && status.plan === "premium"
        && status.emailUsage?.limit === 300;
      if (premiumUsageReady) return;
    } finally {
      this.isRefreshingPlanStatus = false;
    }

    window.setTimeout(() => void this.pollCheckoutStatus(pollId, attemptsRemaining - 1), 2000);
  }

  private async openStripePortal(): Promise<void> {
    this.isOpeningBilling = true;
    this.render();
    try {
      const url = await createStripePortal(this.plugin.settings.pluginToken || "", this.app.vault.getName());
      window.open(url, "_blank");
    } catch (error) {
      new Notice(error instanceof Error ? error.message : String(error), 10000);
    } finally {
      this.isOpeningBilling = false;
      this.render();
    }
  }

  private async refreshPlanStatus(): Promise<void> {
    const token = this.plugin.settings.pluginToken?.trim();
    if (!token || this.isRefreshingPlanStatus) {
      return;
    }

    this.isRefreshingPlanStatus = true;
    const before = this.planStatusKey(getCachedPremiumStatus());
    try {
      const status = await getPremiumStatus(token, true);
      if (this.planStatusKey(status) !== before) {
        this.render();
      }
    } finally {
      this.isRefreshingPlanStatus = false;
    }
  }

  private planStatusKey(status: PremiumStatus): string {
    return JSON.stringify({
      loading: status.loading,
      isPremium: status.isPremium,
      plan: status.plan,
      source: status.source,
      used: status.emailUsage?.used,
      limit: status.emailUsage?.limit,
    });
  }

  private renderNotificationEmailSettings(containerEl: HTMLElement, language: string): void {
    this.renderLegacySection(containerEl, getTranslation(language, "settings.notificationEmail.title"));

    const verifiedEmail = this.plugin.settings.notificationEmailStatus === "verified"
      ? this.plugin.settings.notificationEmail
      : "";
    const hasPendingVerification = !!this.plugin.settings.emailVerificationId;
    if (!this.candidateEmail && this.plugin.settings.pendingNotificationEmail) {
      this.candidateEmail = this.plugin.settings.pendingNotificationEmail;
    }

    if (verifiedEmail) {
      const activeEmailSetting = new Setting(containerEl)
        .setName(getTranslation(language, "settings.notificationEmail.activeAddress"))
        .setDesc(verifiedEmail);
      activeEmailSetting.settingEl.addClass("notelert-active-email");

      if (!this.isEditingNotificationEmail && !hasPendingVerification) {
        activeEmailSetting.addButton((button) => {
          button
            .setButtonText(getTranslation(language, "settings.notificationEmail.changeAddress"))
            .onClick(() => {
              this.candidateEmail = "";
              this.isEditingNotificationEmail = true;
              this.render();
            });
        });
      }
    }

    const shouldShowEmailInput = !verifiedEmail || this.isEditingNotificationEmail || hasPendingVerification;
    if (!shouldShowEmailInput) {
      return;
    }

    const emailSetting = new Setting(containerEl)
      .setName(getTranslation(language, "settings.notificationEmail.address"))
      .setDesc(hasPendingVerification
        ? getTranslation(language, "settings.notificationEmail.pending")
        : getTranslation(language, "settings.notificationEmail.desc"));
    const legalNotice = createDiv(emailSetting.descEl, {
      cls: "notelert-email-legal-notice",
      text: `${getTranslation(language, "settings.accountPrivacy.emailLegalPrefix")} `,
    });
    createEl(legalNotice, "a", {
      text: getTranslation(language, "settings.accountPrivacy.privacy"),
      attr: { href: NOTELERT_PRIVACY_URL, target: "_blank", rel: "noopener noreferrer" },
    });
    legalNotice.appendText(` ${getTranslation(language, "settings.accountPrivacy.and")} `);
    createEl(legalNotice, "a", {
      text: getTranslation(language, "settings.accountPrivacy.terms"),
      attr: { href: NOTELERT_TERMS_URL, target: "_blank", rel: "noopener noreferrer" },
    });

    let setValidationButtonState: ((isValid: boolean) => void) | undefined;
    emailSetting
      .addText((text) => {
        text
          .setPlaceholder("usuario@email.com")
          .setValue(this.candidateEmail)
          .setDisabled(this.isSendingVerificationCode)
          .onChange((value) => {
            this.candidateEmail = value.trim();
            setValidationButtonState?.(this.isValidEmail(this.candidateEmail));
          });
        text.inputEl.type = "email";
        text.inputEl.autocomplete = "email";
      })
      .addButton((button) => {
        const isValid = this.isValidEmail(this.candidateEmail);
        button
          .setButtonText(getTranslation(language, "settings.notificationEmail.validateAddress"))
          .setDisabled(!isValid || this.isSendingVerificationCode)
          .onClick(() => {
            void this.sendVerificationCode(language);
          });
        button.buttonEl.addClass("notelert-validate-email-button");
        button.buttonEl.toggleClass("is-valid", isValid);
        this.renderButtonLoading(
          button.buttonEl,
          this.isSendingVerificationCode,
          getTranslation(language, "settings.notificationEmail.validateAddress")
        );
        setValidationButtonState = (nextIsValid) => {
          button.setDisabled(!nextIsValid || this.isSendingVerificationCode);
          button.buttonEl.toggleClass("is-valid", nextIsValid);
        };
      });

    if (hasPendingVerification) {
      new Setting(containerEl)
        .setName(getTranslation(language, "settings.notificationEmail.code"))
        .setDesc(getTranslation(language, "settings.notificationEmail.codeDesc"))
        .addText((text) => {
          text
            .setPlaceholder("000000")
            .setValue(this.verificationCode)
            .setDisabled(this.isVerifyingEmailCode)
            .onChange((value) => {
              this.verificationCode = value.replace(/\D/g, "").slice(0, 6);
            });
        })
        .addButton((button) => {
          button
            .setCta()
            .setButtonText(getTranslation(language, "settings.notificationEmail.verify"))
            .setDisabled(this.isVerifyingEmailCode)
            .onClick(() => {
              void this.verifyCode(language);
            });
          this.renderButtonLoading(
            button.buttonEl,
            this.isVerifyingEmailCode,
            getTranslation(language, "settings.notificationEmail.verify")
          );
        });
    }
  }

  private renderDeliveryModeSettings(containerEl: HTMLElement, language: string): void {
    new Setting(containerEl)
      .setName(getTranslation(language, "settings.deliveryMode.title"))
      .setDesc(getTranslation(language, "settings.deliveryMode.desc"))
      .addDropdown((dropdown) => {
        dropdown
          .addOption("push", getTranslation(language, "settings.deliveryMode.push"))
          .addOption("email", getTranslation(language, "settings.deliveryMode.email"))
          .addOption("both", getTranslation(language, "settings.deliveryMode.both"))
          .setValue(this.plugin.settings.deliveryMode)
          .onChange((value) => {
            void (async () => {
              this.plugin.settings.deliveryMode = value as "push" | "email" | "both";
              await this.plugin.saveSettings();
            })();
          });
      });
  }

  private renderButtonLoading(buttonEl: HTMLButtonElement, loading: boolean, label: string): void {
    buttonEl.replaceChildren();
    if (!loading) {
      buttonEl.textContent = label;
      buttonEl.removeAttribute("aria-busy");
      return;
    }

    const spinner = createEl(buttonEl, "span");
    spinner.className = "notelert-spinner notelert-button-spinner";
    spinner.setAttribute("aria-hidden", "true");
    buttonEl.setAttribute("aria-busy", "true");
    buttonEl.setAttribute("aria-label", label);
  }

  private async sendVerificationCode(language: string): Promise<void> {
    const email = this.candidateEmail.trim().toLowerCase();
    if (!this.isValidEmail(email)) {
      new Notice(getTranslation(language, "settings.notificationEmail.invalid"), 8000);
      return;
    }

    this.isSendingVerificationCode = true;
    this.render();
    try {
      const result = await requestEmailVerification({
        email,
        installationId: this.plugin.settings.pluginInstallationId,
        pluginToken: this.plugin.settings.pluginToken,
      });
      this.plugin.settings.pendingNotificationEmail = email;
      if (this.plugin.settings.notificationEmailStatus !== "verified") {
        this.plugin.settings.notificationEmailStatus = "pending";
      }
      this.plugin.settings.emailVerificationId = result.verificationId;
      this.plugin.settings.emailVerificationExpiresAt = result.expiresAt;
      this.isEditingNotificationEmail = true;
      await this.plugin.saveSettings();
      new Notice(getTranslation(language, "settings.notificationEmail.codeSent", { email }), 8000);
    } catch (error) {
      new Notice(error instanceof Error ? error.message : String(error), 10000);
    } finally {
      this.isSendingVerificationCode = false;
      this.render();
    }
  }

  private async verifyCode(language: string): Promise<void> {
    if (!/^\d{6}$/.test(this.verificationCode)) {
      new Notice(getTranslation(language, "settings.notificationEmail.invalidCode"), 8000);
      return;
    }

    this.isVerifyingEmailCode = true;
    this.render();
    try {
      const result = await verifyNotificationEmail({
        verificationId: this.plugin.settings.emailVerificationId,
        code: this.verificationCode,
        installationId: this.plugin.settings.pluginInstallationId,
        pluginToken: this.plugin.settings.pluginToken,
      });
      if (result.pluginToken) {
        this.plugin.settings.pluginToken = result.pluginToken;
      }
      this.plugin.settings.notificationEmail = result.notificationEmail || "";
      this.plugin.settings.userEmail = result.notificationEmail || "";
      this.plugin.settings.notificationEmailStatus = "verified";
      this.plugin.settings.pendingNotificationEmail = "";
      this.plugin.settings.hasActivePushDevice = result.hasActivePushDevice;
      this.plugin.settings.emailVerificationId = "";
      this.plugin.settings.emailVerificationExpiresAt = "";
      this.verificationCode = "";
      this.candidateEmail = "";
      this.isEditingNotificationEmail = false;
      await this.plugin.saveSettings();
      new Notice(getTranslation(language, "settings.notificationEmail.success", {
        email: result.notificationEmail || "",
      }), 10000);
    } catch (error) {
      new Notice(error instanceof Error ? error.message : String(error), 10000);
    } finally {
      this.isVerifyingEmailCode = false;
      this.render();
    }
  }

  private isValidEmail(value: string): boolean {
    const email = value.trim().toLowerCase();
    if (!email || email.length > 254) {
      return false;
    }

    const parts = email.split("@");
    if (parts.length !== 2) {
      return false;
    }

    const [localPart, domain] = parts;
    return !!localPart &&
      !!domain &&
      localPart.length <= 64 &&
      domain.length <= 253 &&
      !domain.startsWith(".") &&
      !domain.endsWith(".") &&
      !domain.includes("..") &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private renderLegacySection(containerEl: HTMLElement, heading: string): void {
    const headingEl = createEl(containerEl, "h3", {
      text: heading,
    });
    headingEl.addClass("notelert-legacy-section-heading");
  }

  private renderLegacyBanner(containerEl: HTMLElement, language: string): void {
    const bannerContainer = createDiv(containerEl, {
      attr: {
        style: `
          padding: 15px;
          background: var(--background-secondary);
          border-radius: 8px;
          border-left: 4px solid var(--text-warning);
          position: relative;
          padding-right: 56px;
          margin-bottom: 1rem;
        `
      }
    });

    const closeButton = createEl(bannerContainer, "button", {
      attr: {
        style: `
          position: absolute;
          top: 10px;
          right: 10px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 18px;
          padding: 4px 8px;
          line-height: 1;
        `
      },
      text: "×"
    });
    closeButton.onclick = () => {
      this.app.saveLocalStorage(this.bannerDismissedKey, "true");
      this.render();
    };

    createEl(bannerContainer, "p", {
      text: getTranslation(language, "settings.appRequired.message"),
      attr: {
        style: "margin: 0 0 10px 0; color: var(--text-muted); font-size: 13px; line-height: 1.6; max-width: 68ch;"
      }
    });

    createEl(bannerContainer, "a", {
      text: getTranslation(language, "settings.appRequired.downloadLink"),
      attr: {
        href: "https://play.google.com/store/apps/details?id=com.quim79.notelert",
        target: "_blank",
        style: `
          display: inline-block;
          margin-top: 5px;
          color: var(--text-accent);
          text-decoration: none;
          font-weight: 500;
        `
      }
    });
  }
}

class RevokeInstallationModal extends Modal {
  constructor(
    app: App,
    private readonly message: string,
    private readonly onConfirm: () => void
  ) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.empty();
    createEl(this.contentEl, "p", { text: this.message });
    const actions = createDiv(this.contentEl, { cls: "modal-button-container" });

    const cancelButton = createEl(actions, "button", { text: "Cancel" });
    cancelButton.addEventListener("click", () => this.close());

    const confirmButton = createEl(actions, "button", {
      text: "Confirm",
      cls: "mod-warning",
    });
    confirmButton.addEventListener("click", () => {
      this.onConfirm();
      this.close();
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
