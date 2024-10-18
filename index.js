const { PrismaClient } = require("@prisma/client");
const dotenv = require('dotenv'); 
const express = require('express');
const router = express.Router();
const prisma=new PrismaClient();
const app = express();




dotenv.config(); 
const PORT = process.env.PORT || 8000;
app.use(express.json());


router.get('/', async (req, res) => {
  try {
    const email = req.session?.user?.email; 
    //what ever method is being used to recog the logged in ambass.change..
    

    let responseData = {
      currentUser: null,
      topUsers: [],
    };

    
    const topUsers = await prisma.user.findMany({
      orderBy: {
        points: 'desc', // Order by points in descending order
      },
      take: 3,
      select: {
        name: true,
        points: true,
      },
    });

    
    if (email) {
      const userData = await prisma.user.findUnique({
        where: { email: email }, // find user by email
        select: {
          id: true,
          name: true,
          collegeName: true,
          collegeYear: true,
          phone: true,
          points: true,
          tasks: true, 
        },
      });

     
      if (userData) {
        responseData.currentUser = userData;
      } else {
        return res.status(404).json({ error: 'User not found' });
      }
    } else {
      return res.status(400).json({ error: 'User email not found in session' });
    }

    // top three users
    responseData.topUsers = topUsers;

    // combined response
    res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});

 
router.post('/update', async (req, res) => {
    const { id, name, collegeName, collegeYear, phone } = req.body;

    try {
        
        const updatedUser = await prisma.user.update({
            where: { id: id }, // finding user by id
            data: {
                name: name,
                collegeName: collegeName,
                collegeYear: collegeYear,
                phone: phone,
            },
        });

        res.json(updatedUser); // Return the updated user data
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Unable to update user' });
    }
});

router.post('/register', async (req, res) => {
  const {
    name,
    collegeName,
    collegeYear,
    program,
    phone,
    email,
    POR,
    reasonToJoin,
    roleInStudentBody,
    skills,
    experience,
    roleInEcell,
    hours,
    contribution,
    motivation
  } = req.body;

  try {
    const newUser = await prisma.user.create({
      data: {
        name,
        collegeName,
        collegeYear,
        program,
        phone,
        email,
        POR,
        reasonToJoin,
        roleInStudentBody,
        skills,
        experience,
        roleInEcell,
        hours,
        contribution,
        motivation,
        points: 0 // Default points to 0
      }
    });

    res.status(201).json({ message: 'User successfully added', user: newUser });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Unable to add user' });
  }
});

// Use the defined routes
app.use('/',router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
