// Maneja la gestion de formularios y modales
export class FormManager {
  constructor(formId, modalId = null) {
    this.formId = formId; // ID del formulario a manejar
    this.modalId = modalId; // ID del modal
    this.isSubmitting = false; // Evita envios multiples
  }

  // Configura el evento de submit del formulario
  setupForm(submitCallback) {
    const form = document.getElementById(this.formId);
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Previene el doble envio
      if (this.isSubmitting) {
        console.log("Formulario ya en proceso de envio");
        return;
      }

      this.isSubmitting = true;
      await submitCallback(this.getFormData(form));
      this.isSubmitting = false;
    });

    // Limpia el formulario cuando se cierra el modal
    if (this.modalId) {
      const modal = document.getElementById(this.modalId);
      if (modal) {
        modal.addEventListener("hidden.bs.modal", () => {
          form.reset();
          this.isSubmitting = false; // Resetea el estado al cerrar
        });
      }
    }
  }

  // Obtiene los datos del formulario como objeto
  getFormData(form) {
    const data = {};
    const inputs = form.querySelectorAll("input, textarea, select");

    inputs.forEach((input) => {
      if (input.name && input.type !== "submit" && input.type !== "button") {
        const value = input.value.trim();

        // Convierte campos vacios a null
        data[input.name] = value === "" ? null : value;
      }
    });

    return data;
  }

  // Procesa el envio del formulario con estado de carga
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

  // Cambia el estado del boton de envio
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

  // Cierra el modal asociado al formulario
  closeModal() {
    if (this.modalId) {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById(this.modalId)
      );
      modal?.hide();
    }
  }

  // Llena el formulario con datos existentes (para edicion)
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