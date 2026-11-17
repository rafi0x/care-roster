import { Router } from 'express';
import { objectId } from '../../utils/query';
import { createPatient, deletePatient, listPatients, patientBody, patientListQuery } from '../patients/patient.service';
import {
  createDoctor,
  deleteDoctor,
  doctorBody,
  doctorFilters,
  doctorListQuery,
  doctorUpdateBody,
  getDoctor,
  listDoctors,
  updateDoctor,
} from './doctor.service';

export const doctorRouter = Router();

doctorRouter.get('/', async (req, res) => {
  res.json(await listDoctors(doctorListQuery.parse(req.query)));
});

doctorRouter.post('/', async (req, res) => {
  res.status(201).json({ data: await createDoctor(doctorBody.parse(req.body)) });
});

// Declared before '/:id' so "filters" is not treated as an id.
doctorRouter.get('/filters', async (_req, res) => {
  res.json({ data: await doctorFilters() });
});

doctorRouter.get('/:id', async (req, res) => {
  res.json({ data: await getDoctor(objectId.parse(req.params.id)) });
});

doctorRouter.patch('/:id', async (req, res) => {
  res.json({ data: await updateDoctor(objectId.parse(req.params.id), doctorUpdateBody.parse(req.body)) });
});

doctorRouter.delete('/:id', async (req, res) => {
  await deleteDoctor(objectId.parse(req.params.id));
  res.status(204).end();
});

// --- A doctor's patients ---

doctorRouter.get('/:id/patients', async (req, res) => {
  const doctor = objectId.parse(req.params.id);
  res.json(await listPatients({ ...patientListQuery.parse(req.query), doctor }));
});

doctorRouter.post('/:id/patients', async (req, res) => {
  res.status(201).json({ data: await createPatient(objectId.parse(req.params.id), patientBody.parse(req.body)) });
});

doctorRouter.delete('/:id/patients/:patientId', async (req, res) => {
  await deletePatient(objectId.parse(req.params.patientId), objectId.parse(req.params.id));
  res.status(204).end();
});
