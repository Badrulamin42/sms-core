import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { Project } from '../entity/Project/project';
import { saveImageToEntityGallery } from '../service/galleryUploader';
import { upload } from '../config/mutler'; // Assuming your multer config is in 'middleware/upload'
import { ProjectUnit } from '../entity/Project/projectUnit';

const projectUnitRouter = Router();

// Create project route with file upload
projectUnitRouter.post('/create', upload.array('image', 5), async (req: Request, res: Response) => {
    try {
        const { name: unitName, description, creator, squareFeet, totalDimension, builtDimension, price, tenureType, landTitle, bed, bath, projectId } = req.body;

        // Check if required fields are present
        if (!unitName) {
            return res.status(400).json({ message: 'Project name is required' });
        }

        const projectUnitRepo = AppDataSource.getRepository(ProjectUnit);

        // Create a new project
        const newProjectUnit = projectUnitRepo.create({
            unitName,
            description,
            creator,
            squareFeet,
            totalDimension,
            builtDimension,
            price,
            tenureType,
            landTitle,
            bed,
            bath,
            project: projectId
        });

        // Save the project
        const savedProjectUnit = await projectUnitRepo.save(newProjectUnit);

            const galleryPromises = (req.files as Express.Multer.File[]).map(file =>
            saveImageToEntityGallery({
                file,
                entityId: savedProjectUnit.id,
                entityType: 'projectUnit',
                req,
            })
            );

            await Promise.all(galleryPromises);


        // Fetch the complete project with galleries
        const completeProject = await projectUnitRepo.findOne({
            where: { id: savedProjectUnit.id },
            relations: ['galleries'], // Ensure galleries are loaded
        });

        res.status(201).json({
            message: 'Project Unit created successfully',
            project: completeProject,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create project unit' });
    }
});


export default projectUnitRouter;
