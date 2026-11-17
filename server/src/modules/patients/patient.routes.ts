import { Router } from 'express';
import { objectId } from '../../utils/query';
import { deletePatient, listPatients, patientListQuery, patientUpdateBody, updatePatient } from './patient.service';

export const patientRouter = Router();

patientRouter.get('/', async (req, res) => {
  res.json(await listPatients(patientListQuery.parse(req.query)));
});

patientRouter.patch('/:id', async (req, res) => {
  res.json({ data: await updatePatient(objectId.parse(req.params.id), patientUpdateBody.parse(req.body)) });
});

patientRouter.delete('/:id', async (req, res) => {
  await deletePatient(objectId.parse(req.params.id));
  res.status(204).end();
});
