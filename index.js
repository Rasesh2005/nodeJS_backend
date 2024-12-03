const { PrismaClient } = require("@prisma/client");
const dotenv = require('dotenv'); 
const express = require('express');
const router = express.Router();
const prisma=new PrismaClient();
const app = express();


const cors = require('cors');
// Enable CORS for all routes
app.use(cors());


dotenv.config(); 
const PORT = process.env.PORT || 8000;
app.use(express.json());

// router.post('/submit',async (req, res)=>{
  
// });
// router.post('/edit',async (req, res)=>{
  
// });


// router.get('/', async (req, res) => {
//   try {
//     const email = req.session?.user?.email; 
//     //what ever method is being used to recog the logged in ambass.change..
    

//     let responseData = {
//       currentUser: null,
//       topUsers: [],
//     };

    
    // const topUsers = await prisma.user.findMany({
    //   orderBy: {
    //     points: 'desc', // Order by points in descending order
    //   },
    //   take: 3,
    //   select: {
    //     name: true,
    //     points: true,
    //   },
    // });

    
//     if (email) {
      // const userData = await prisma.user.findUnique({
      //   where: { email: email }, // find user by email
      //   select: {
      //     id: true,
      //     name: true,
      //     collegeName: true,
      //     collegeYear: true,
      //     phone: true,
      //     points: true,
      //     tasks: true, 
      //   },
      // });

     
//       if (userData) {
//         responseData.currentUser = userData;
//       } else {
//         return res.status(404).json({ error: 'User not found' });
//       }
//     } else {
//       return res.status(400).json({ error: 'User email not found in session' });
//     }

//     // top three users
//     responseData.topUsers = topUsers;

//     // combined response
    // res.status(200).json(responseData);
//   } catch (error) {
    // console.error(error);
    // res.status(500).json({ error: 'An error occurred while fetching user data' });
//   }
// });



//profile userdata
router.get('/campusambassador', async(req,res)=>{
  const userEmail = req.user?.email; 
  try{
    const userData = await prisma.user.findUnique({
      where: { email: userEmail }, 
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
    res.status(200).json(userData);

  }catch(error){
    console.error(error);
    res.status(500).json({ error: 'could not fetch user data' });

  }
});


//leaderboard top 10
router.get('/campusambassador', async (req, res) => {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: {
        points: 'desc', 
      },
      take: 10,
      select: {
        name: true,
        points: true,
        collegeName:true,
      },
    });
    res.status(200).json(topUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching top user data' });
  }
});


//tasks section data 
router.get('/campusambassador', async (req, res) => {
  const userId = req.user?.id;  

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User not logged in' });
  }

  try {
    const tasks = await prisma.task.findMany({
      where: { userId: userId },
      select: {
        id: true,
        title: true,
        lastDate: true,
        submitted:true,
        submission: true,
        description: true,
      },
    });
 
    const currentDate = new Date();
    
 
    const processedTasks = tasks.map(task => {
      let status = "Pending"; 

      if (!task.submitted && task.lastDate < currentDate) {
        status = "Missing";  // If no submission and the deadline has passed
      } else if (task.submitted) {
        status = "Submitted";  // If submission exists
      }

    
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: status,  
        submitted: task.submitted, 
        lastDate: task.lastDate,  
      };
    });
    res.status(200).json(processedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'An error occurred while fetching tasks info' });
  }
});

// task section drive link submission
router.post('/submit', async (req, res) => {
  const { taskId, submission } = req.body; 
  const userEmail = req.user?.email; 

  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedTask = await prisma.task.updateMany({
      where: {
        id: taskId, 
        userId: user.id, 
      },
      data: {
        submission: submission,
        submitted:true 
      },
    });

    if (updatedTask.count === 0) {
      return res.status(404).json({ error: 'Task not found for this user' });
    }

    res.status(200).json({
      message: 'Task submission updated successfully.',
    });
  } catch (error) {
    console.error('Error updating task submission:', error);
    res.status(500).json({ error: 'An error occurred while updating the task submission.' });
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
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email
      }
    });
    if (existingUser) {
      console.log("user found")
      return res.status(400).json({ error: 'You have already submitted the form', user: existingUser });
    }

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

    res.status(201).json({ message: 'User successfully registered!', user: newUser });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Unable to add user' });
  }
});

router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Server is alive' });
});

// Use the defined routes
app.use('/',router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
