import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  sender_id!: string;

  @Column("uuid")
  receiver_id!: string;

  @Column("text")
  text!: string;

  @CreateDateColumn({ type: "timestamp" })
  timestamp!: Date;

  @Column({ type: "boolean", default: false })
  is_read!: boolean;
}
