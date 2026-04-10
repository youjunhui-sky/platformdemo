import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DictType } from '../../../entities/platform/dict-type.entity';
import { DictInfo } from '../../../entities/platform/dict-info.entity';

@Injectable()
export class DictService {
  constructor(
    @InjectRepository(DictType)
    private readonly dictTypeRepository: Repository<DictType>,
    @InjectRepository(DictInfo)
    private readonly dictInfoRepository: Repository<DictInfo>,
  ) {}

  async createType(data: any) {
    const type = this.dictTypeRepository.create(data);
    return this.dictTypeRepository.save(type);
  }

  async updateType(id: string, data: any) {
    await this.dictTypeRepository.update(id, data);
    return this.dictTypeRepository.findOneBy({ id });
  }

  async deleteType(id: string) {
    await this.dictInfoRepository.delete({ typeId: id });
    await this.dictTypeRepository.delete(id);
  }

  async findAllTypes() {
    return this.dictTypeRepository.find({
      order: { createdAt: 'ASC' },
    });
  }

  async findTypeById(id: string) {
    return this.dictTypeRepository.findOneBy({ id });
  }

  async createDictInfo(data: any) {
    const dictInfo = this.dictInfoRepository.create(data);
    return this.dictInfoRepository.save(dictInfo);
  }

  async updateDictInfo(id: string, data: any) {
    await this.dictInfoRepository.update(id, data);
    return this.dictInfoRepository.findOneBy({ id });
  }

  async deleteDictInfo(id: string) {
    await this.deleteChildDicts(id);
    await this.dictInfoRepository.delete(id);
  }

  async deleteChildDicts(parentId: string) {
    const children = await this.dictInfoRepository.findBy({ parentId });
    for (const child of children) {
      await this.deleteChildDicts(child.id);
      await this.dictInfoRepository.delete(child.id);
    }
  }

  async findDictInfosByType(typeId: string) {
    return this.dictInfoRepository.find({
      where: { typeId },
      order: { orderNum: 'ASC', createdAt: 'ASC' },
    });
  }

  async findAllDictInfos() {
    return this.dictInfoRepository.find({
      order: { typeId: 'ASC', orderNum: 'ASC', createdAt: 'ASC' },
    });
  }

  async getDictData(types?: string[]) {
    const result: Record<string, any[]> = {};
    let typeEntities: DictType[];

    if (types && types.length > 0) {
      typeEntities = await this.dictTypeRepository.find({
        where: { key: In(types) },
      });
    } else {
      typeEntities = await this.dictTypeRepository.find();
    }

    if (!typeEntities || typeEntities.length === 0) {
      return result;
    }

    const typeIds = typeEntities.map((t) => t.id);
    const dictInfos = await this.dictInfoRepository
      .createQueryBuilder('info')
      .select(['info.id', 'info.name', 'info.value', 'info.typeId', 'info.orderNum'])
      .where('info.typeId IN (:...typeIds)', { typeIds })
      .orderBy('info.orderNum', 'ASC')
      .addOrderBy('info.createdAt', 'ASC')
      .getMany();

    for (const type of typeEntities) {
      result[type.key] = dictInfos
        .filter((info) => info.typeId === type.id)
        .map((info) => ({
          id: info.id,
          name: info.name,
          value: info.value,
        }));
    }
    return result;
  }

  async getDictTypes() {
    return this.dictTypeRepository.find();
  }

  async getDictName(id: string) {
    return this.dictInfoRepository.findOneBy({ id });
  }
}