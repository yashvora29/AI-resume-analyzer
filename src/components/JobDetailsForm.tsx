import type { JobDetails } from "../types";

type Props = {
  value: JobDetails;
  disabled: boolean;
  onChange: (value: JobDetails) => void;
};

const fieldClass =
  "mt-2 w-full rounded-lg border border-[#d8ded8] bg-white px-3.5 py-3 text-sm text-[#26372e] placeholder:text-[#a0a8a1] transition focus:border-[#74927d] focus:outline-none";

export function JobDetailsForm({ value, disabled, onChange }: Props) {
  function update(field: keyof JobDetails, next: string) {
    onChange({ ...value, [field]: next });
  }

  return (
    <section aria-labelledby="job-details-heading">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="job-details-heading" className="text-sm font-semibold text-[#26372e]">
          The role you&apos;re considering <span className="text-[#b4503d]">*</span>
        </h2>
        <span className="text-xs text-[#818a83]">Required fields marked *</span>
      </div>
      <label className="block text-sm font-medium text-[#455249]" htmlFor="job-title">
        Job title <span className="text-[#b4503d]">*</span>
        <input
          id="job-title"
          name="jobTitle"
          type="text"
          maxLength={120}
          placeholder="e.g. Product Designer"
          value={value.title}
          onChange={(event) => update("title", event.target.value)}
          disabled={disabled}
          className={fieldClass}
          required
        />
      </label>
      <label className="mt-5 block text-sm font-medium text-[#455249]" htmlFor="job-description">
        Job description <span className="text-[#b4503d]">*</span>
        <textarea
          id="job-description"
          name="jobDescription"
          rows={4}
          maxLength={10_000}
          placeholder="Paste the role overview and what the team is looking for..."
          value={value.description}
          onChange={(event) => update("description", event.target.value)}
          disabled={disabled}
          className={`${fieldClass} resize-y`}
          required
        />
      </label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <OptionalField
          id="responsibilities"
          label="Responsibilities"
          placeholder="Main responsibilities, one per line"
          value={value.responsibilities}
          onChange={(next) => update("responsibilities", next)}
          disabled={disabled}
        />
        <OptionalField
          id="required-skills"
          label="Required skills"
          placeholder="Python, Figma, stakeholder communication..."
          value={value.requiredSkills}
          onChange={(next) => update("requiredSkills", next)}
          disabled={disabled}
        />
        <OptionalField
          id="required-experience"
          label="Required experience"
          placeholder="Years, industries, or relevant experience"
          value={value.requiredExperience}
          onChange={(next) => update("requiredExperience", next)}
          disabled={disabled}
        />
        <OptionalField
          id="education"
          label="Education requirements"
          placeholder="Degree, field, or equivalent experience"
          value={value.education}
          onChange={(next) => update("education", next)}
          disabled={disabled}
        />
      </div>
    </section>
  );
}

type OptionalFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
};

function OptionalField({
  id,
  label,
  placeholder,
  value,
  disabled,
  onChange,
}: OptionalFieldProps) {
  return (
    <label className="block text-sm font-medium text-[#455249]" htmlFor={id}>
      {label} <span className="font-normal text-[#8d968e]">· optional</span>
      <textarea
        id={id}
        name={id}
        rows={3}
        maxLength={10_000}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`${fieldClass} resize-y`}
      />
    </label>
  );
}
