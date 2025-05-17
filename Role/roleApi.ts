import { Router } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { Role } from '../entity/User/roles';

const roleRouter = Router();
const roleRepo = AppDataSource.getRepository(Role);

// CREATE
roleRouter.post('/create', async (req, res) => {
  const role = roleRepo.create(req.body); // expects: { name: "admin" }
  await roleRepo.save(role);
  res.status(201).json(role);
});

// READ ALL
roleRouter.get('/list', async (req, res) => {
  const roles = await roleRepo.find();
  res.json(roles);
});

// READ ONE
roleRouter.get('/:id', async (req, res) => {
  const role = await roleRepo.findOne({ where: { id: req.params.id } });
  if (!role) return res.status(404).json({ message: 'Role not found' });
  res.json(role);
});

// UPDATE
roleRouter.put('/:id', async (req, res) => {
  const role = await roleRepo.findOneBy({ id: req.params.id });
  if (!role) return res.status(404).json({ message: 'Role not found' });

  role.name = req.body.name;
  await roleRepo.save(role);
  res.json(role);
});

// DELETE
roleRouter.delete('/:id', async (req, res) => {
  const role = await roleRepo.findOneBy({ id: req.params.id });
  if (!role) return res.status(404).json({ message: 'Role not found' });

  await roleRepo.remove(role);
  res.json({ message: 'Role deleted' });
});

export default roleRouter;
