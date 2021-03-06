import {BaseEntity, Column, Entity, ObjectIdColumn} from "typeorm";
import {Exclude} from "class-transformer";
import {ICreatedAtUpdateAt} from "./ICreatedAtUpdateAt";

/**
 * The kanban board card information.
 */
@Entity()
export class BoardCardEntity extends BaseEntity implements ICreatedAtUpdateAt {

    /**
     * pk
     */
    @ObjectIdColumn()
    public _id: string;

    /**
     * Board block title
     */
    @Column()
    public title: string;

    /**
     * Board block status
     */
    @Column()
    public status: string;

    /**
     * The date time for create board card.
     */
    @Column({
        type: "date"
    })
    public createdAt: Date;

    /**
     * The date time for update board card.
     */
    @Column({
        type: "date"
    })
    public updatedAt: Date;

    /**
     * The flag for check this entity has implemented ICreatedAtUpdateAt
     * @return createdAt
     */
    @Exclude()
    public createdAtFlag(): Date {
        return this.createdAt;
    }

    /**
     * The flag for check this entity has implemented ICreatedAtUpdateAt
     * @return updatedAt
     */
    @Exclude()
    public updatedAtFlag(): Date {
        return this.updatedAt;
    }
}
