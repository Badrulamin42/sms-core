import { AppDataSource } from '../config/ormconfig';
import { Gallery } from '../entity/Gallery/gallery';
import { Request } from 'express';
import { ObjectLiteral, Repository } from 'typeorm';

type SaveGalleryOptions = {
  file: Express.Multer.File;
  entityId: string;
  entityType: 'project' | 'projectUnit' | 'user'; // Extend this as needed
  req: Request;
};

export const saveImageToEntityGallery = async ({
  file,
  entityId,
  entityType,
  req,
}: SaveGalleryOptions): Promise<Gallery> => {
  const galleryRepo = AppDataSource.getRepository(Gallery);

  // Dynamically choose the entity repo
  let entityRepo: Repository<ObjectLiteral>;
  let relationKey: keyof Gallery;

  switch (entityType) {
    case 'project':
      entityRepo = AppDataSource.getRepository(require('../entity/Project/project').Project);
      relationKey = 'project';
      break;
    case 'projectUnit':
      entityRepo = AppDataSource.getRepository(require('../entity/Project/projectUnit').ProjectUnit);
      relationKey = 'projectUnit';
      break;
    default:
      throw new Error('Unsupported entity type for gallery association');
  }

  const entity = await entityRepo.findOne({ where: { id: entityId } });
  if (!entity) throw new Error(`${entityType} not found`);

  const imageUrl = `${process.env.REACT_APP_HMS_DEV}/uploads/${file.filename}`;

  const gallery = galleryRepo.create({
    imageUrl,
    [relationKey]: entity,
    uploadedAt: new Date(),
  });

  return await galleryRepo.save(gallery);
};
