import { html } from "lit";
import { mdiCog } from "@mdi/js";
import { icon } from "../utils/icons.js";

export const atomGoConfigUI = (component) => html`
  <div class="main-container">
    <div class="single-panel-wrapper">
      <!-- Form Section -->
      <div class="form-section">
        <div class="section-title">
          ${icon(mdiCog)} AtoM Configuration
        </div>

        <div class="form-scroll-container">
          <!-- Details Category -->
          <div class="category">
            <div class="category-header">Connection Details</div>

            <div class="form-grid">
              <div class="form-field">
                <md-outlined-text-field
                  label="Host"
                  placeholder="localhost:8000"
                  .value=${component.host}
                  @input=${(e) => (component.host = e.target.value)}
                  required
                ></md-outlined-text-field>
              </div>

              <div class="form-field">
                <md-outlined-text-field
                  label="API Key"
                  type="password"
                  .value=${component.apikey}
                  @input=${(e) => (component.apikey = e.target.value)}
                  required
                ></md-outlined-text-field>
              </div>

              <div class="form-field">
                <md-outlined-text-field
                  label="Login Email"
                  type="email"
                  placeholder="admin@example.com"
                  .value=${component.loginemail}
                  @input=${(e) => (component.loginemail = e.target.value)}
                  required
                ></md-outlined-text-field>
              </div>

              <div class="form-field">
                <md-outlined-text-field
                  label="Login Password"
                  type="password"
                  .value=${component.loginpassword}
                  @input=${(e) => (component.loginpassword = e.target.value)}
                  required
                ></md-outlined-text-field>
              </div>
            </div>
          </div>

          <!-- Rsync Configuration -->
          <div class="category">
            <div class="category-header">Rsync Configuration</div>

            <div class="form-grid">
              <div class="form-field">
                <md-outlined-text-field
                  label="Rsync Target"
                  placeholder="user@host:/var/www/atom/uploads"
                  .value=${component.rsynctarget}
                  @input=${(e) => (component.rsynctarget = e.target.value)}
                  required
                ></md-outlined-text-field>
              </div>

              <div class="form-field">
                <md-outlined-text-field
                  label="Rsync Command"
                  placeholder="-e 'ssh -p 2222'"
                  .value=${component.rsynccommand}
                  @input=${(e) => (component.rsynccommand = e.target.value)}
                ></md-outlined-text-field>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <md-filled-button
            @click=${component.saveConfig}
            ?disabled=${!component.canSave}
          >
            ${component.saveInProgress
              ? html`<div class="spinner"></div>`
              : ""}
            ${component.saveButtonText}
          </md-filled-button>
          <md-outlined-button @click=${component.clearForm}>
            Clear Form
          </md-outlined-button>
        </div>
      </div>
    </div>
  </div>
`;