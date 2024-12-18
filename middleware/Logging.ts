import { getRepository } from "typeorm";
import { Log } from "../entity/log";
import { AppDataSource } from '../config/ormconfig';

export const createLog = async (
    action: "CREATE" | "UPDATE" | "DELETE",
    tableName: string,
    data: object,
    actionBy: string,
) => {
    const logRepository = AppDataSource.getRepository(Log);
    const log = logRepository.create({
        action,
        tableName,
        data,
        actionBy
    });
    await logRepository.save(log);
};
