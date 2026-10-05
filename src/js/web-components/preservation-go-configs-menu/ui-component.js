import { html } from "lit";
import { when } from "lit/directives/when.js";
import { mdiStar, mdiStarOutline, mdiCog } from "@mdi/js";
import { icon } from "../utils/icons.js";
import { isDefaultConfigId } from "./api-client.js";

export const preservationGoConfigUI = (component) => html`
  <div class="main-container">
    <div class="panels-wrapper">
      <!-- Form Section -->
      <div class="form-section">
        <div class="section-title">${icon(mdiCog)} Create or Edit Configs</div>

        <div class="form-scroll-container">
          ${when(
            component.isDefaultConfig,
            () => html`
              <div class="info-panel">
                The default configuration can't be edited. Press Clear Form to create a new config.
              </div>
            `,
          )}

          <!-- Details Category -->
          <div class="category">
            <div class="category-header">Details</div>

            <div class="form-field">
              <md-outlined-text-field
                label="Config Name"
                .value=${component.configName}
                @input=${(e) => (component.configName = e.target.value)}
                required
                ?disabled=${component.isDefaultConfig}
              ></md-outlined-text-field>
            </div>

            <div class="form-field">
              <md-outlined-text-field
                label="Config Description"
                .value=${component.configDescription}
                @input=${(e) => (component.configDescription = e.target.value)}
                ?disabled=${component.isDefaultConfig}
              ></md-outlined-text-field>
            </div>
          </div>

          <!-- Directory and Transfer Processing -->
          <div class="category">
            <div class="category-header">Directory and Transfer Processing</div>

            <div class="toggle-field">
              <md-switch
                .selected=${component.AssignUuidsToDirectories}
                @change=${() =>
                  (component.AssignUuidsToDirectories = !component.AssignUuidsToDirectories)}
                ?disabled=${component.isDefaultConfig}
              ></md-switch>
              <label>Assign UUIDs to Directories</label>
            </div>

            <div class="toggle-field">
              <md-switch
                .selected=${component.ExamineContents}
                @change=${() => (component.ExamineContents = !component.ExamineContents)}
                ?disabled=${component.isDefaultConfig}
              ></md-switch>
              <label>Examine Contents</label>
            </div>

            <div class="toggle-field">
              <md-switch
                .selected=${component.GenerateTransferStructureReport}
                @change=${() =>
                  (component.GenerateTransferStructureReport =
                    !component.GenerateTransferStructureReport)}
                ?disabled=${component.isDefaultConfig}
              ></md-switch>
              <label>Generate Transfer Structure Report</label>
            </div>

            <div class="toggle-field">
              <md-switch
                .selected=${component.DocumentEmptyDirectories}
                @change=${() =>
                  (component.DocumentEmptyDirectories = !component.DocumentEmptyDirectories)}
                ?disabled=${component.isDefaultConfig}
              ></md-switch>
              <label>Document Empty Directories</label>
            </div>
          </div>

          <!-- Package Extraction -->
          <div class="category">
            <div class="category-header">Package Extraction</div>

            <div class="toggle-field">
              <md-switch
                .selected=${component.ExtractPackages}
                @change=${() => (component.ExtractPackages = !component.ExtractPackages)}
                ?disabled=${component.isDefaultConfig}
              ></md-switch>
              <label>Extract Packages</label>
            </div>

            <div class="suboptions ${component.ExtractPackages ? "enabled" : ""}">
              <div class="toggle-field">
                <md-switch
                  .selected=${component.DeletePackagesAfterExtraction}
                  @change=${() =>
                    (component.DeletePackagesAfterExtraction =
                      !component.DeletePackagesAfterExtraction)}
                  ?disabled=${!component.ExtractPackages || component.isDefaultConfig}
                ></md-switch>
                <label>Delete Packages After Extraction</label>
              </div>
            </div>
          </div>

          <!-- Identification -->
          <div class="category">
            <div class="category-header">Identification</div>

            <div class="toggle-field">
              <md-switch
                .selected=${component.IdentifyTransfer}
                @change=${() => (component.IdentifyTransfer = !component.IdentifyTransfer)}
                ?disabled=${component.isDefaultConfig}
              ></md-switch>
              <label>Identify Transfer</label>
            </div>

            <div class="toggle-field">
              <md-switch
                .selected=${component.IdentifySubmissionAndMetadata}
                @change=${() =>
                  (component.IdentifySubmissionAndMetadata =
                    !component.IdentifySubmissionAndMetadata)}
                ?disabled=${component.isDefaultConfig}
              ></md-switch>
              <label>Identify Submission and Metadata</label>
            </div>

            <div class="toggle-field">
              <md-switch
                .selected=${component.IdentifyBeforeNormalization}
                @change=${() =>
                  (component.IdentifyBeforeNormalization = !component.IdentifyBeforeNormalization)}
                ?disabled=${component.isDefaultConfig}
              ></md-switch>
              <label>Identify Before Normalization</label>
            </div>
          </div>

          <!-- Normalization -->
          <div class="category">
            <div class="category-header">Normalization</div>

            <div class="toggle-field">
              <md-switch
                .selected=${component.Normalize}
                @change=${() => (component.Normalize = !component.Normalize)}
                ?disabled=${component.isDefaultConfig}
              ></md-switch>
              <label>Normalize Files</label>
            </div>

            <div class="toggle-field">
              <md-switch
                .selected=${component.TranscribeFiles}
                @change=${() => (component.TranscribeFiles = !component.TranscribeFiles)}
                ?disabled=${component.isDefaultConfig}
              ></md-switch>
              <label>Transcribe Files</label>
            </div>
          </div>

          <!-- Policy Checks -->
          <div class="category">
            <div class="category-header">Policy Checks</div>

            <div class="toggle-field">
              <md-switch
                .selected=${component.PerformPolicyChecksOnOriginals}
                @change=${() =>
                  (component.PerformPolicyChecksOnOriginals =
                    !component.PerformPolicyChecksOnOriginals)}
                ?disabled=${component.isDefaultConfig}
              ></md-switch>
              <label>Perform Policy Checks on Originals</label>
            </div>

            <div class="toggle-field">
              <md-switch
                .selected=${component.PerformPolicyChecksOnPreservationDerivatives}
                @change=${() =>
                  (component.PerformPolicyChecksOnPreservationDerivatives =
                    !component.PerformPolicyChecksOnPreservationDerivatives)}
                ?disabled=${component.isDefaultConfig}
              ></md-switch>
              <label> Perform Policy Checks on Preservation Derivatives </label>
            </div>

            <div class="toggle-field">
              <md-switch
                .selected=${component.PerformPolicyChecksOnAccessDerivatives}
                @change=${() =>
                  (component.PerformPolicyChecksOnAccessDerivatives =
                    !component.PerformPolicyChecksOnAccessDerivatives)}
                ?disabled=${component.isDefaultConfig}
              ></md-switch>
              <label>Perform Policy Checks on Access Derivatives</label>
            </div>
          </div>

          <!-- Thumbnail Generation -->
          <div class="category">
            <div class="category-header">Thumbnail Generation</div>

            <div class="form-field">
              <md-outlined-select
                label="Thumbnail Mode"
                .value=${component.ThumbnailMode.toString()}
                @change=${(e) => (component.ThumbnailMode = parseInt(e.target.value))}
                ?disabled=${component.isDefaultConfig}
              >
                <md-select-option value="1">
                  <div slot="headline">Generate</div>
                </md-select-option>
                <md-select-option value="2">
                  <div slot="headline">Generate (Non-default)</div>
                </md-select-option>
                <md-select-option value="3">
                  <div slot="headline">Do Not Generate</div>
                </md-select-option>
              </md-outlined-select>
            </div>
          </div>

          <!-- AIP Compression -->
          <div class="category">
            <div class="category-header">AIP Compression</div>

            <div class="toggle-field">
              <md-switch
                .selected=${component.CompressAip}
                @change=${() => (component.CompressAip = !component.CompressAip)}
                ?disabled=${component.isDefaultConfig}
              ></md-switch>
              <label>Compress AIP</label>
            </div>

            <div class="suboptions ${component.CompressAip ? "enabled" : ""}">
              <div class="info-panel">
                Compressing AIPs makes their contents unsearchable and breaks metadata
                reassociation. To preserve searchability, compress only for distribution or deep
                storage by right-clicking the AIP in a workspace while keeping the original
                uncompressed.
              </div>

              <div class="form-field">
                <md-outlined-select
                  label="Compression Algorithm"
                  .value=${component.AipCompressionAlgorithm}
                  @change=${(e) => (component.AipCompressionAlgorithm = e.target.value)}
                  ?disabled=${!component.CompressAip || component.isDefaultConfig}
                >
                  <md-select-option value="ZIP">
                    <div slot="headline">ZIP</div>
                  </md-select-option>
                </md-outlined-select>
              </div>

              <div class="form-field">
                <div class="info-panel">
                  <em>Compression level options coming soon</em>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <md-filled-button @click=${component.saveConfig} ?disabled=${!component.canSave}>
            ${component.saveInProgress ? html`<div class="spinner"></div>` : ""}
            ${component.saveButtonText}
          </md-filled-button>
          <md-outlined-button @click=${component.clearForm}> Clear Form </md-outlined-button>
        </div>
      </div>

      <!-- Saved Configs Section -->
      <div class="saved-configs-section">
        <div class="section-title">${icon(mdiStar)} Saved Configs</div>

        <div class="scroll-container">
          ${
            component.isLoading
              ? html`
                  <div class="loading">
                    <div class="spinner"></div>
                    Loading configurations...
                  </div>
                `
              : component.savedConfigs.length === 0
                ? html`
                    <div class="no-configs">
                      ${
                        component.loadError
                          ? "Failed to load preservation configs. Please try refreshing or check your connection."
                          : "No Saved Preservation Configs Found"
                      }
                    </div>
                  `
                : component.savedConfigs.map(
                    (config, index) => html`
                      <div
                        class="config-item"
                        style="animation-delay: ${index * 0.1}s"
                        @click=${() => component.loadConfig(config)}
                      >
                        <div class="config-header">
                          <div class="config-name">
                            ${config.name}
                            ${when(
                              isDefaultConfigId(config.id),
                              () => html`<span class="readonly-badge">Read-only</span>`,
                            )}
                          </div>
                          <div class="config-actions">
                            <md-icon-button
                              class="${component.isBookmarked(config.id) ? "starred" : ""}"
                              @click=${(e) => {
                                e.stopPropagation();
                                component.toggleBookmark(config.id);
                              }}
                            >
                              ${
                                component.isBookmarked(config.id)
                                  ? icon(mdiStar)
                                  : icon(mdiStarOutline)
                              }
                            </md-icon-button>
                            ${when(!isDefaultConfigId(config.id), () => {
                              return html`
                                <md-outlined-button
                                  class="delete-btn"
                                  @click=${(e) => {
                                    e.stopPropagation();
                                    component.deleteConfig(config.id);
                                  }}
                                >
                                  Delete
                                </md-outlined-button>
                              `;
                            })}
                          </div>
                        </div>
                        <div class="config-details">
                          <div class="config-description">
                            <strong>Description:</strong>
                            ${config.description || "No description"}
                          </div>
                          <div>
                            <strong>Normalize:</strong>
                            ${config.a3m_config?.normalize ? "Yes" : "No"}
                          </div>
                          <div>
                            <strong>Compress AIP:</strong>
                            ${config.compress_aip ? "Yes" : "No"}
                          </div>
                        </div>
                      </div>
                    `,
                  )
          }
        </div>
      </div>
    </div>
  </div>
`;
