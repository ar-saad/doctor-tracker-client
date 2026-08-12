"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import type { FilterOption } from "@/components/FilterBar";
import { Modal, ModalFooter } from "@/components/Modal";
import { notify } from "@/components/StatusToast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, errorMessage } from "@/lib/api";
import { titleCase } from "@/lib/format";
import {
  collectErrors,
  hasErrors,
  requiredText,
  validateAge,
  validatePhone,
  type FieldErrors,
} from "@/lib/validation";
import {
  GENDERS,
  type Gender,
  type PatientInput,
  type PatientUpdateInput,
} from "@/types";

/**
 * Create and edit a patient.
 *
 * The two modes hit structurally different endpoints — a patient is created
 * under its doctor (POST /doctors/:id/patients, so the doctor comes from the
 * URL and cannot be forged in the body) but updated on its own resource
 * (PUT /patients/:id). Which one is used follows from whether `patient` was
 * passed, exactly as in DoctorFormModal.
 *
 * That asymmetry is also why only the edit mode can offer a doctor picker:
 * reassignment is a field on PUT /patients/:id, whereas on create the doctor is
 * the URL. The picker is opt-in via `doctorOptions` — the doctor detail page
 * has no business letting you file a patient away from the doctor you are
 * looking at, and does not pass them.
 */

/**
 * Gender is deliberately not in here. It is a Select over a closed set, so it
 * can never be empty or malformed and has nothing to validate — and keeping it
 * out lets setField stay honestly typed as (string field, string value).
 */
type Field = "name" | "age" | "phone" | "condition";

/**
 * The subset of a patient this form edits. Declared structurally so both
 * `Patient` (doctor populated) and `DoctorPatient` (doctor as a raw id) can be
 * handed to it without a cast — the form does not care about the doctor field.
 */
export interface EditablePatient {
  _id: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  condition: string;
}

/** Age is held as a string: an <input type="number"> has no "empty number". */
interface FormValues {
  name: string;
  age: string;
  gender: Gender;
  phone: string;
  condition: string;
}

const EMPTY: FormValues = {
  name: "",
  age: "",
  gender: "male",
  phone: "",
  condition: "",
};

function validatePatient(values: FormValues): FieldErrors<Field> {
  return collectErrors<Field>({
    name: requiredText("Name", values.name),
    age: validateAge(values.age),
    phone: validatePhone(values.phone),
    condition: requiredText("Condition", values.condition),
  });
}

interface PatientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * The doctor this form is filed under: the one a new patient is created for
   * in create mode (where it is required), and the patient's current doctor in
   * edit mode, where it seeds the picker below and is the value a change is
   * measured against.
   */
  doctorId?: string;
  /**
   * Doctors to choose from, as id/name pairs. Passing them turns the doctor
   * into an editable field; omitting them leaves it fixed. Edit mode only.
   */
  doctorOptions?: readonly FilterOption[];
  /** Absent = create. Present = edit that patient. */
  patient?: EditablePatient | null;
  /** Called after the API confirms the write, so the caller can refetch. */
  onSaved: () => void;
}

export function PatientFormModal({
  open,
  onOpenChange,
  doctorId,
  doctorOptions,
  patient = null,
  onSaved,
}: PatientFormModalProps) {
  const [pending, setPending] = useState(false);
  const isEdit = patient !== null;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit patient" : "Add patient"}
      description={
        isEdit
          ? "Update this patient's details."
          : "Register a patient under this doctor. All fields are required."
      }
      busy={pending}
    >
      {/* Same remount-on-open contract as DoctorFormModal — see the comment
          there and in Modal.tsx. */}
      <PatientForm
        key={patient?._id ?? "new"}
        patient={patient}
        doctorId={doctorId}
        doctorOptions={doctorOptions}
        pending={pending}
        setPending={setPending}
        onSaved={onSaved}
        onDone={() => onOpenChange(false)}
      />
    </Modal>
  );
}

interface PatientFormProps {
  patient: EditablePatient | null;
  doctorId: string | undefined;
  doctorOptions: readonly FilterOption[] | undefined;
  pending: boolean;
  setPending: (pending: boolean) => void;
  onSaved: () => void;
  onDone: () => void;
}

function PatientForm({
  patient,
  doctorId,
  doctorOptions,
  pending,
  setPending,
  onSaved,
  onDone,
}: PatientFormProps) {
  const fieldId = useId();
  const isEdit = patient !== null;

  const [values, setValues] = useState<FormValues>(() =>
    patient
      ? {
          name: patient.name,
          age: String(patient.age),
          gender: patient.gender,
          phone: patient.phone,
          condition: patient.condition,
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);

  /**
   * The doctor sits beside `values` rather than inside it: it is not part of the
   * create payload, so folding it in would make FormValues stop mirroring
   * PatientInput and give `Field` a member with nothing to validate. A Select
   * over a known set cannot be empty or malformed anyway — same reasoning as
   * gender, which is in `values` only because it IS part of the payload.
   */
  const [selectedDoctor, setSelectedDoctor] = useState(doctorId ?? "");
  const showDoctorPicker = isEdit && doctorOptions !== undefined;

  function setField(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function setGender(gender: Gender) {
    setValues((current) => ({ ...current, gender }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validatePatient(values);
    setErrors(found);
    setFormError(null);

    if (hasErrors(found)) {
      return;
    }

    // Number(), not the raw string: the API's Zod schema is strict and will not
    // coerce "34" into 34. validateAge has already proved this parses.
    const payload: PatientInput = {
      name: values.name.trim(),
      age: Number(values.age),
      gender: values.gender,
      phone: values.phone.trim(),
      condition: values.condition.trim(),
    };

    setPending(true);

    try {
      if (isEdit) {
        const update: PatientUpdateInput = { ...payload };

        // Only when it actually moved: the API re-checks that any `doctor` in
        // the body exists, so resending the current one buys a lookup and
        // nothing else.
        if (showDoctorPicker && selectedDoctor !== doctorId) {
          update.doctor = selectedDoctor;
        }

        await api.put(`/patients/${patient._id}`, update);
      } else {
        await api.post(`/doctors/${doctorId}/patients`, payload);
      }

      notify.success(isEdit ? "Patient updated" : "Patient added");
      onSaved();
      onDone();
    } catch (cause) {
      setFormError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  /** Every text field is the same three elements; only the copy differs. */
  function textField(
    field: Field,
    label: string,
    placeholder: string,
    extra?: React.ComponentProps<typeof Input>,
  ) {
    const error = errors[field];
    const id = `${fieldId}-${field}`;

    return (
      <>
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          value={values[field]}
          placeholder={placeholder}
          onChange={(event) => setField(field, event.target.value)}
          disabled={pending}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-9"
          {...extra}
        />
        {error ? (
          <p id={`${id}-error`} className="text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          {textField("name", "Name", "Jordan Ellis")}
        </div>

        <div className="space-y-2">
          {textField("age", "Age", "42", {
            type: "number",
            inputMode: "numeric",
            min: 0,
            max: 130,
          })}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${fieldId}-gender`}>Gender</Label>
          {/* Radix Select is not a native <select>, so it is not part of the
              form's submission — the value is read from state like the rest. */}
          <Select
            value={values.gender}
            onValueChange={(next) => setGender(next as Gender)}
            disabled={pending}
          >
            <SelectTrigger id={`${fieldId}-gender`} className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {GENDERS.map((gender) => (
                <SelectItem key={gender} value={gender}>
                  {titleCase(gender)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {textField("phone", "Phone", "+44 20 7946 0102", { type: "tel" })}
        </div>

        <div className="space-y-2">
          {textField("condition", "Condition", "Hypertension")}
        </div>

        {showDoctorPicker ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${fieldId}-doctor`}>Doctor</Label>
            <Select
              value={selectedDoctor}
              onValueChange={setSelectedDoctor}
              disabled={pending}
            >
              <SelectTrigger id={`${fieldId}-doctor`} className="h-9 w-full">
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent position="popper">
                {doctorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Changing this moves the patient to another doctor&apos;s list.
            </p>
          </div>
        ) : null}
      </div>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {isEdit ? "Save changes" : "Add patient"}
        </Button>
      </ModalFooter>
    </form>
  );
}
