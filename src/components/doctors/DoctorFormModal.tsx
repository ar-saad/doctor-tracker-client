"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal, ModalFooter } from "@/components/Modal";
import { notify } from "@/components/StatusToast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, errorMessage } from "@/lib/api";
import {
  collectErrors,
  hasErrors,
  requiredText,
  validateEmail,
  validatePhone,
  type FieldErrors,
} from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { Doctor, DoctorInput } from "@/types";

/**
 * Create and edit in one component.
 *
 * They differ by exactly two things — the verb (POST vs PUT) and whether the
 * fields start empty — so splitting them would duplicate the whole form and its
 * validation to express a boolean. `doctor` being present IS edit mode.
 */

type Field = keyof DoctorInput;

const EMPTY: DoctorInput = {
  name: "",
  specialization: "",
  hospital: "",
  phone: "",
  email: "",
};

interface FieldSpec {
  name: Field;
  label: string;
  type?: string;
  placeholder: string;
  /** Full-width in the two-column grid. */
  wide?: boolean;
}

const FIELDS: readonly FieldSpec[] = [
  { name: "name", label: "Name", placeholder: "Dr. Amara Osei", wide: true },
  { name: "specialization", label: "Specialization", placeholder: "Cardiology" },
  { name: "hospital", label: "Hospital", placeholder: "St. Mary's" },
  { name: "phone", label: "Phone", type: "tel", placeholder: "+44 20 7946 0102" },
  { name: "email", label: "Email", type: "email", placeholder: "a.osei@example.com" },
];

function validateDoctor(values: DoctorInput): FieldErrors<Field> {
  return collectErrors<Field>({
    name: requiredText("Name", values.name),
    specialization: requiredText("Specialization", values.specialization),
    hospital: requiredText("Hospital", values.hospital),
    phone: validatePhone(values.phone),
    email: validateEmail(values.email),
  });
}

interface DoctorFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Absent = create. Present = edit that doctor. */
  doctor?: Doctor | null;
  /** Called after the API confirms the write, so the caller can refetch. */
  onSaved: (doctor: Doctor) => void;
}

export function DoctorFormModal({
  open,
  onOpenChange,
  doctor = null,
  onSaved,
}: DoctorFormModalProps) {
  /**
   * `pending` lives out here, in the part that stays mounted, because the modal
   * shell needs it to block Escape mid-submit. Everything else the form owns is
   * inside DoctorForm.
   */
  const [pending, setPending] = useState(false);
  const isEdit = doctor !== null;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit doctor" : "Add doctor"}
      description={
        isEdit
          ? "Update this doctor's details."
          : "Add a doctor to the directory. All fields are required."
      }
      busy={pending}
    >
      {/*
        Radix unmounts dialog content while closed, so DoctorForm's state is
        seeded from `doctor` by useState on every open — no reset effect, and no
        way for one doctor's values to survive into the next dialog. The key
        covers the remaining case: the identity changing while the content is
        still mounted through the close animation.
      */}
      <DoctorForm
        key={doctor?._id ?? "new"}
        doctor={doctor}
        pending={pending}
        setPending={setPending}
        onSaved={onSaved}
        onDone={() => onOpenChange(false)}
      />
    </Modal>
  );
}

interface DoctorFormProps {
  doctor: Doctor | null;
  pending: boolean;
  setPending: (pending: boolean) => void;
  onSaved: (doctor: Doctor) => void;
  onDone: () => void;
}

function DoctorForm({
  doctor,
  pending,
  setPending,
  onSaved,
  onDone,
}: DoctorFormProps) {
  const fieldId = useId();
  const isEdit = doctor !== null;

  const [values, setValues] = useState<DoctorInput>(() =>
    doctor
      ? {
          name: doctor.name,
          specialization: doctor.specialization,
          hospital: doctor.hospital,
          phone: doctor.phone,
          email: doctor.email,
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function setField(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));

    // Clear a field's error as soon as it is touched; re-validating on every
    // keystroke would shout "invalid email" at someone who has typed one letter.
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validateDoctor(values);
    setErrors(found);
    setFormError(null);

    if (hasErrors(found)) {
      return;
    }

    // Trim here, once, rather than on every keystroke — a trimming onChange
    // makes it impossible to type a space between first and last name.
    const payload: DoctorInput = {
      name: values.name.trim(),
      specialization: values.specialization.trim(),
      hospital: values.hospital.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
    };

    setPending(true);

    try {
      const { data } = isEdit
        ? await api.put<Doctor>(`/doctors/${doctor._id}`, payload)
        : await api.post<Doctor>("/doctors", payload);

      notify.success(isEdit ? "Doctor updated" : "Doctor added");
      onSaved(data);
      onDone();
    } catch (cause) {
      /**
       * The 409 from a duplicate email lands here. It is shown inline rather
       * than as a toast because it is about a specific field the user can still
       * see and fix — a toast would vanish while they were reading it.
       */
      setFormError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    // noValidate: the browser's own bubbles would pre-empt the messages below,
    // which are the ones that match the API's rules.
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(({ name, label, type, placeholder, wide }) => {
          const error = errors[name];
          const id = `${fieldId}-${name}`;

          return (
            <div key={name} className={cn("space-y-2", wide && "sm:col-span-2")}>
              <Label htmlFor={id}>{label}</Label>
              <Input
                id={id}
                name={name}
                type={type ?? "text"}
                value={values[name]}
                placeholder={placeholder}
                onChange={(event) => setField(name, event.target.value)}
                disabled={pending}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className="h-9"
              />
              {error ? (
                <p id={`${id}-error`} className="text-xs text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {isEdit ? "Save changes" : "Add doctor"}
        </Button>
      </ModalFooter>
    </form>
  );
}
