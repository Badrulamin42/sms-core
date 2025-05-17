import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { Project } from '../entity/Project/project';
import { saveImageToGallery } from '../service/galleryUploader';
import { upload } from '../config/mutler'; // Assuming your multer config is in 'middleware/upload'
import { ProjectUnit } from '../entity/Project/projectUnit';

const projectRouter = Router();

// Create project route with file upload
projectRouter.post('/create', upload.array('image', 5), async (req: Request, res: Response) => {
  try {
    const { name, description, creator, status, propertyType, address } = req.body;

    // Check if required fields are present
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const projectRepo = AppDataSource.getRepository(Project);

    // Create a new project
    const newProject = projectRepo.create({
      name,
      description,
      creator,
      status,
      propertyType,
      address
    });

    // Save the project
    const savedProject = await projectRepo.save(newProject);

    // Process gallery images if they exist
    if (req.files && Array.isArray(req.files)) {
      // Use the saveImageToGallery service to save images
      const galleryPromises = (req.files as Express.Multer.File[]).map(file =>
        saveImageToGallery(file, savedProject.id, req) // Save image and associate with the project
      );

      await Promise.all(galleryPromises); // Wait for all gallery images to be saved
    }

    // Fetch the complete project with galleries
    const completeProject = await projectRepo.findOne({
      where: { id: savedProject.id },
      relations: ['galleries'], // Ensure galleries are loaded
    });

    res.status(201).json({
      message: 'Project created successfully with galleries',
      project: completeProject,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create project' });
  }
});

// project lists
projectRouter.get('/list', async (req, res) => {
  try {
    const projectRepository = AppDataSource.getRepository(Project);

    const projects = await projectRepository.find({
      select: ['id', 'name', 'description', 'createdAt', 'creator', 'propertyType', 'status'], // `galleries` must not be here
      relations: ['galleries'], // This tells TypeORM to load the galleries relation
    });

    res.json( projects );
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).send('Database query error');
  }
});

// project detail
projectRouter.get('/details', async (req, res) => {
  try {
    const projectReqId: any = req.query.ID;
    const projectUnitRepository = AppDataSource.getRepository(ProjectUnit);
    const projectUnit = await projectUnitRepository.findOneBy({ id: projectReqId });

    if (!projectUnit) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json( 
      {
        success: true,
        data: projectUnit,
      }
     );
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).send('Database query error');
  }
});



export default projectRouter;
