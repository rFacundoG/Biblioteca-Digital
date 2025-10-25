export class FormManager {
  constructor(formId, modalId = null) {
    this.formId = formId;
    this.modalId = modalId;
    this.isSubmitting = false;
  }

  setupForm(submitCallback) {
    const form = document.getElementById(this.formId);
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Prevenir doble envío
      if (this.isSubmitting) {
        console.log("Formulario ya en proceso de envío");
        return;
      }

      this.isSubmitting = true;
      await submitCallback(this.getFormData(form));
      this.isSubmitting = false;
    });

    if (this.modalId) {
      const modal = document.getElementById(this.modalId);
      if (modal) {
        modal.addEventListener("hidden.bs.modal", () => {
          form.reset();
          this.isSubmitting = false; // Resetear estado al cerrar modal
        });
      }
    }
  }

  getFormData(form) {
    const data = {};
    const inputs = form.querySelectorAll("input, textarea, select");

    inputs.forEach((input) => {
      if (input.name && input.type !== "submit" && input.type !== "button") {
        // Para todos los inputs (text, email, tel, textarea, select)
        const value = input.value.trim();

        // Convertir a null si está vacío (opcional para todos los campos)
        data[input.name] = value === "" ? null : value;
      }
    });

    return data;
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
