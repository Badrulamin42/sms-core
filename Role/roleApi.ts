import { Router } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { Role } from '../entity/User/roles';
import { In } from 'typeorm';
import { Permission } from '../entity/User/permission';

const roleRouter = Router();
const roleRepo = AppDataSource.getRepository(Role);
const permRepo = AppDataSource.getRepository(Permission);
// CREATE
roleRouter.post('/create', async (req, res) => {
  const { name, permissionIds } = req.body;

  const permissions = await permRepo.findBy({ id: In(permissionIds) });
  const newRole = roleRepo.create({ name, permissions });

  await roleRepo.save(newRole);

  return res.status(201).json(newRole);
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

// POST /roles/:roleId/permissions
roleRouter.post('/:roleId/permissions', async (req, res) => {
  const { permissionIds } = req.body;

  const role = await roleRepo.findOne({
    where: { id: req.params.roleId },
    relations: ['permissions'],
  });

  if (!role) {
    return res.status(404).json({ message: 'Role not found' });
  }

  const permissions = await permRepo.findBy({
    id: In(permissionIds),
  });

  role.permissions = permissions;

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
