import { AppDataSource } from '../config/ormconfig';
import { Gallery } from '../entity/Gallery/gallery';
import { Project } from '../entity/Project/project';
import { Request } from 'express'; // Importing Request type from Express

export const saveImageToGallery = async (
  file: Express.Multer.File, 
  projectId: string, 
  req: Request // Ensure 'req' is correctly typed as Express.Request
): Promise<Gallery> => {
  const projectRepo = AppDataSource.getRepository(Project);
  const galleryRepo = AppDataSource.getRepository(Gallery);

  // Construct the URL of the uploaded image
  const url = `/uploads/${file.filename}`;
  
  const fullUrl = `${process.env.REACT_APP_HMS_DEV + '/uploads/' + file.filename}`;

  // Find the project to associate with the image
  const project = await projectRepo.findOne({ where: { id: projectId } });
  if (!project) {
    throw new Error('Project not found');
  }

  // Create a new Gallery entry and associate it with the project
  const gallery = galleryRepo.create({
    imageUrl: fullUrl,
    project: project, // Associate with project
    uploadedAt: new Date(), // Explicitly set uploadedAt timestamp
  });

  // Save and return the gallery entry
  return await galleryRepo.save(gallery);
};
