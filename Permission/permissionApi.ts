
import { Router } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { Role } from '../entity/User/roles';
import { Permission } from '../entity/User/permission';
import { In } from 'typeorm';

const permRouter = Router();
const permRepo = AppDataSource.getRepository(Permission);
const roleRepo = AppDataSource.getRepository(Role);

// GET /permissions
permRouter.get('/list', async (req, res) => {
    const permissions = await permRepo
        .createQueryBuilder('permission')
        .select(['permission.id', 'permission.name'])
        .getMany();

    res.json(permissions);
});

export default permRouter;
