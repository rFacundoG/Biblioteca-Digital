export class FormManager {
  constructor(formId, modalId = null) {
    this.formId = formId;
    this.modalId = modalId;
  }

  setupForm(submitCallback) {
    const form = document.getElementById(this.formId);
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await submitCallback(this.getFormData(form));
    });

    if (this.modalId) {
      const modal = document.getElementById(this.modalId);
      if (modal) {
        modal.addEventListener("hidden.bs.modal", () => {
          form.reset();
        });
      }
    }
  }

  getFormData(form) {
    const data = {};
    const inputs = form.querySelectorAll("input, textarea, select");

    inputs.forEach((input) => {
      if (input.name && input.type !== "submit" && input.type !== "button") {
        // Para checkboxes
        if (input.type === "checkbox") {
          data[input.name] = input.checked;
        }
        // Para radios
        else if (input.type === "radio") {
          if (input.checked) {
            data[input.name] = input.value;
          }
        }
        // Para otros inputs
        else {
          const value = input.value.trim();
          // Solo convertir a null si el campo está vacío y es opcional
          if (value === "" && this.isOptionalField(input.name)) {
            data[input.name] = null;
          } else {
            data[input.name] = value;
          }
        }
      }
    });

    return data;
  }

  // Método para identificar campos opcionales
  isOptionalField(fieldName) {
    const optionalFields = [
      "email",
      "telefono",
      "descripcion",
      "portada_url",
      "anio_publicacion",
      "isbn",
    ];
    return optionalFields.includes(fieldName);
  }

  async submitForm(submitCallback, formData) {
    const form = document.getElementById(this.formId);
    const submitBtn = form?.querySelector('button[type="submit"]');
    const originalText = submitBtn?.innerHTML;

    try {
      this.toggleSubmitButton(submitBtn, true, "Guardando...");
      await submitCallback(formData);
      this.closeModal();
      return true;
    } catch (error) {
      throw error;
    } finally {
      this.toggleSubmitButton(submitBtn, false, originalText);
    }
  }

  toggleSubmitButton(button, loading, text = "") {
    if (!button) return;

    if (loading) {
      button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>' + text;
      button.disabled = true;
    } else {
      button.innerHTML = text;
      button.disabled = false;
    }
  }

  closeModal() {
    if (this.modalId) {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById(this.modalId)
      );
      modal?.hide();
    }
  }

  fillForm(data) {
    const form = document.getElementById(this.formId);
    if (!form) return;

    Object.keys(data).forEach((key) => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        if (input.type === "checkbox") {
          input.checked = Boolean(data[key]);
        } else {
          input.value = data[key] || "";
        }
      }
    });
  }
}
