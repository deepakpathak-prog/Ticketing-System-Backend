const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("./config/cloudinary");
// const bcrypt = require('bcrypt');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const bcrypt = require("bcrypt");
require("dotenv").config();

const key = process.env.SECRET_KEY;

// const { connect } = require('./config/database');
const Customer_Table = require("./models/CustomerTable");
const NewTicket = require("./models/NewTicket");
// const {syncModels} =  require('./models/index')

// const dummyDetails = async () => {
//   try {
//     // await connect();
//     // await syncModels();

//     const newCustomer = await Customer_Table.create({
//       user_id: 7,
//       organization_id: 7,
//       customer_name: 'New',
//       company_legal_name: '',
//       company_url: '',
//       area_of_work: '',
//       phone_number: '',
//       email: 'new2@gmail.com',
//       password: 'Test@123',
//       address: '',
//       country: '',
//       city: '',
//       postal_code: '',
//       about_company: '',
//       work_domain: '',
//       profile_url: '',
//       role: '',
//       onBoarded: false,
//     });

//     console.log('Customer created successfully:', newCustomer);
//   } catch (error) {
//     console.error('Error creating customer:', error);
//   }
// };

// dummyDetails();

// const connection = async () => {
//   // await connect();
//   await syncModels();
// }

// connection();

const app = express();
const port = 8000;

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.use(
  session({
    secret: "ZAQ!2wsxCDE#4rfv",
    resave: false,
    saveUninitialized: false,
  })
);

function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, key, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.userId = decoded.userId;
    next();
  });
}


app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Customer_Table.findOne({
      where: { email: email },
    });

    if (!user) {
      console.log("user not found")
      return res.status(404).json({ message: "User not found" });
      
    // } else (user.password === password) {
    //   const token = jwt.sign({ userId: user.user_id }, key, {
    //     expiresIn: "1h",
    //   });

    //   req.session.userId = user.user_id;

    //   return res.json({ token, user });
    // }
    }

    if (user.password===password) {
      
      const token = jwt.sign({ userId: user.user_id }, key, {
            expiresIn: "5h",
          });
      

          req.session.userId = user.user_id;
    
          return res.json({ token, user }); 
    }else {
      console.log("incorrect password")
    }

    // const isMatch = await bcrypt.compare(password, user.password);

    // if (!isMatch) {
    //   return res.status(401).json({ message: "Incorrect password" });
    // }
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/addAccountDetails", authMiddleware, async (req, res) => {
  const userId = req.userId;

  try {
    const user = await Customer_Table.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await user.update({
      customer_name: req.body.customer_name,
      company_legal_name: req.body.company_legal_name,
      company_url: req.body.company_url,
      phone_number: req.body.phone_number,
      address: req.body.address,
      country: req.body.country,
      city: req.body.city,
      postal_code: req.body.postal_code,
      about_company: req.body.about_company,
      work_domain: req.body.work_domain,
      
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error adding account details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.put(
  "/updateAccountDetails",
  authMiddleware,
  upload.any(),
  async (req, res) => {
    const userId = req.userId;
    console.log("req", req.files);

    try {
      const user = await Customer_Table.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let profileUrl = user.profile_url;

      console.log("req.files[0]: ", req.files[0]);
      if (req.files[0]) {
        console.log("called");
        // Upload new file to Cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ resource_type: "auto" }, (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result.secure_url);
              }
            })
            .end(req.files[0].buffer);
        });

        console.log("result: ", result);
        profileUrl = result; // Update profile URL with new Cloudinary URL
      }

      const findUser = await Customer_Table.findOne({
        where: {
          user_id: user.organization_id,
        },
      });

      // Update the found user record
      await findUser.update({
        profile_url: profileUrl,
        customer_name: req.body.customer_name,
        company_legal_name: req.body.company_legal_name,
        company_url: req.body.company_url,
        phone_number: req.body.phone_number,
        address: req.body.address,
        country: req.body.country,
        city: req.body.city,
        postal_code: req.body.postal_code,
        about_company: req.body.about_company,
        work_domain: req.body.work_domain,
        onBoarded: true,
      });

      // Response with updated user
      res.json({
        updatedUser: findUser, // Assuming you want to return the updated user
        message: "User updated successfully",
      });
    } catch (error) {
      console.error("Error adding account details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.get("/getUserDetails", authMiddleware, async (req, res) => {
  const userId = req.userId;

  try {
    const user = await Customer_Table.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else {
      res.json({ user });
    }
  } catch (error) {}
});

app.post("/resetPassword", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await Customer_Table.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await user.update({
      password: hashedPassword,
    });

    res.json({ message: "Password updated successfully", updatedUser });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// app.post('/editProfile', authMiddleware, isAuthenticated, async (req, res) => {
//   const userId = req.session.userId;

//   try {

//     const user = await Customer_Table.findByPk(userId);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const updatedUser = await user.update({
//       company_legal_name: req.body.company_legal_name,
//       company_url: req.body.company_url,
//       area_of_work: req.body.area_of_work,
//       phone_number: req.body.phone_number,
//       address: req.body.address,
//       country: req.body.country,
//       city: req.body.city,
//       postal_code: req.body.postal_code,
//       about_company: req.body.about_company,
//       profile_url: req.body.profile_url,
//     });

//     res.json(updatedUser);
//   } catch (error) {
//     console.error('Error adding profile details:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

app.post("/addNewTicket", authMiddleware, upload.any(), async (req, res) => {
  const userId = req.userId;

  try {
    const user = await Customer_Table.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else {
      const fileUploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ resource_type: "auto" }, (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result.secure_url);
              }
            })
            .end(file.buffer);
        });
      });
      const fileUrls = await Promise.all(fileUploadPromises);
      // console.log("fileUrls", fileUrls);

      const newTicket = await NewTicket.create({
        user_id: user.user_id,
        organization_id: user.organization_id,
        company_legal_name: user.company_legal_name,
        ticket_type: req.body.ticket_type,
        priority: req.body.priority,
        status: "Active",
        subject: req.body.subject,
        details: req.body.details,
        role: user.role,
        details_images_url: fileUrls,
      });


      res.json({ newTicket });
    }
  } catch (error) {
    console.error("Error adding profile details:", error);
  }
});

app.get("/viewAllTickets", authMiddleware, async (req, res) => {
  const userId = req.userId;

  try {
    const user = await Customer_Table.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else {
      // res.json({user});
      const tickets = await NewTicket.findAll({
        where: {
          organization_id: user.organization_id,
        },
      });

      res.json({ tickets });
    }
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});

app.get("/viewTicketDetails/:id", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const ticketId = req.params.id;

  try {
    const user = await Customer_Table.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else {
      const ticketDetails = await NewTicket.findAll({
        where: {
          id: ticketId,
        },
      });

      res.json({ ticketDetails, user });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});

app.post("/logout", authMiddleware, async (req, res) => {
  const userId = req.userId;

  try {
    localStorage.removeItem("token");
  } catch (error) {
    console.log(error);
  }
});

// app.post('/ticketFilterByType', authMiddleware, async (req, res) => {
//   const userId = req.userId;

//   try {
//     const user = await Customer_Table.findByPk(userId)

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }else{
//       const type = req.body.type;

//       const ticketDetails = await NewTicket.findAll({
//         where: {
//           user
//           ticket_type: type
//         }
//       });

//       res.json({ticketDetails});

//     }

//   } catch (error) {
//     res.status(500).json({ message: 'Failed to filter tickets' });
//   }
// })


// Updating Ticket api endpoint
app.put('/editTicketDetails/:id', authMiddleware, upload.any(), async (req, res) => {
  const userId = req.userId;
  const ticketId = req.params.id; 
  try {
    const user = await Customer_Table.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Fetch current ticket details
    const currentTicket = await NewTicket.findByPk(ticketId);
    if (!currentTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    let currentFileUrls = [];
    if (currentTicket.details_images_url) {
      currentFileUrls = JSON.parse(currentTicket.details_images_url);
    }

    let newFileUrls = [];
    if (req.files && req.files.length > 0) {
      const fileUploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ resource_type: "auto" }, (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result.secure_url);
              }
            })
            .end(file.buffer);
        });
      });
      newFileUrls = await Promise.all(fileUploadPromises);
    }

    // Combine existing and new file URLs
    const combinedFileUrls = [...currentFileUrls, ...newFileUrls];

    const updatedTicket = {
      ticket_type: req.body.ticket_type,
      priority: req.body.priority,
      subject: req.body.subject,
      details: req.body.details,
      details_images_url: JSON.stringify(combinedFileUrls),
    };

    // Update the ticket
    const [rowsUpdated, [updatedTicketDetails]] = await NewTicket.update(updatedTicket, {
      returning: true,
      where: { id: ticketId },
    });

    res.json({ ticket: updatedTicketDetails });
  } catch (error) {
    console.error("Error editing tickets:", error);
    res.status(500).json({ message: "Failed to edit ticket" });
  }
});

app.put('/deleteTicketImage/:id', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const ticketId = req.params.id; 
  try {
    const user = await Customer_Table.findByPk(userId);
    const currentTicket = await NewTicket.findByPk(ticketId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    

    const filetodelete = req.body.index

    const ticketDetails = await NewTicket.findOne({
      where: {
        id: ticketId,
      },
    });

    const deleteimage = await currentTicket.update({
      details_images_url: '',
    })

    res.json({deleteimage})

    
  } catch (error) {
    console.error("Error editing tickets:", error);
    res.status(500).json({ message: "Failed to edit ticket" });
  }
});


// app.put("/deleteTicketImage/:id", authMiddleware, async (req, res) => {
//   const userId = req.userId;
//   const ticketId = req.params.id; 
//   try {
//     const user = await Customer_Table.findByPk(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const currentTicket = await NewTicket.findByPk(ticketId);

//     if (!currentTicket) {
//       return res.status(404).json({ message: "Ticket not found" });
//     }

//     const updateTicket = {
//       details_images_url: ''
//     };

//     const updatedTicket = await NewTicket.update(updateTicket, {
//       where: { id: ticketId },
//     })

//     res.json({currentTicket});
//   } catch (error) {
    
//   }
// })



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
