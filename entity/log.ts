import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Log {


    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    action!: string; // CREATE, UPDATE, DELETE

    @Column()
    tableName!: string; // The table name being logged

    @Column({ type: "json" })
    data!: object; // Data involved in the action

    @Column()
    actionBy!: string; //Action by a user id

    @Column({ type: 'timestamp' })
    timestamp!: Date;
}
