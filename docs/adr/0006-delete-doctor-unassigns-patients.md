# ADR 0006: Deleting a doctor unassigns patients instead of cascading

- Status: Accepted
- Scope: `deleteDoctor` in `server/src/modules/doctors/doctor.service.ts`, `patient.doctor` in `patient.model.ts`

## Context

Patient records are clinical data; losing them because a doctor record is removed (left the hospital, entered by mistake) is the worse failure. MongoDB multi-document transactions need a replica set, which the local Docker setup does not guarantee.

## Decision

`patient.doctor` is nullable (`null` = unassigned). `deleteDoctor` does three steps in this order:

1. `Doctor.exists` (404 if missing).
2. `Patient.updateMany({doctor: id}, {$set: {doctor: null}})`.
3. `Doctor.deleteOne({_id: id})`.

Unassigned patients are listed with `GET /api/patients?doctor=unassigned` and can be given a new doctor with `PATCH /api/patients/:id {doctor}`.

## Consequences

- No patient data is lost on doctor deletion.
- Ordering rationale without a transaction: if the process fails between steps 2 and 3, the result is unassigned patients and a doctor that still exists; retrying the delete completes it. The reverse order would leave patients pointing at a doctor that no longer exists (a dangling reference that population would return as `null` silently).
- The two writes are not atomic: another request can assign a patient to the doctor between steps 2 and 3, leaving a dangling reference. `createPatient`/`updatePatient` check that the doctor exists, but that check is not isolated from the delete.
- Patients can exist without an owner, so the UI and dashboard must handle `doctor: null` (the dashboard's patients-per-doctor ignores unassigned patients).
- On a replica set, both writes can be wrapped in a session transaction; this is the documented next step.

## Alternatives considered

- Cascade delete: simple, but destroys patient records.
- Block deletion while the doctor has patients (409): safe, but forces a manual reassign of each patient first.
- Delete then unassign: leaves dangling references on failure.
- Soft delete (`deletedAt`): keeps history but touches every query and index.
