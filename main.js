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
const { Op, where } = require("sequelize");
require("dotenv").config();

const key = process.env.SECRET_KEY;

const { connect } = require("./config/database");

const Users = require("./models/Users");
const Roles = require("./models/Roles");
const Mapping = require("./models/Mapping");
const Tickets = require("./models/Tickets");
const Comments = require("./models/Comments");
const Events = require("./models/Events");
const { password } = require("pg/lib/defaults");
const { syncModels } = require("./models/index");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "morphine231201@gmail.com",
    pass: "pihb zufa cqth tazd",
  },
});

// const dummyDetails = async () => {
//   try {
//     // await connect();
//     // await syncModels();

//     const newCustomer = await Users.create({
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
    const user = await Users.findOne({
      where: { email: email },
    });
    if (!user) {
      console.log("user not found");
      return res.status(404).json({ message: "User not found" });
      // } else (user.password === password) {
      //   const token = jwt.sign({ userId: user.user_id }, key, {
      //     expiresIn: "1h",
      //   });
      //   req.session.userId = user.user_id;
      //   return res.json({ token, user });
      // }
    }
    if (user.password === password) {
      const token = jwt.sign({ userId: user.user_id }, key, {
        expiresIn: "5h",
      });
      req.session.userId = user.user_id;
      return res.json({ token, user });
    } else {
      console.log("incorrect password");
    }
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});



app.post("/addAccountDetails", authMiddleware, async (req, res) => {
  const userId = req.userId;

  try {
    const user = await Users.findByPk(userId);

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
      const user = await Users.findOne({
        where: {
          user_id: userId,
        },
      });

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

      const findUser = await Users.findOne({
        where: {
          user_id: userId,
        },
      });

      console.log("found user", findUser);

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
  let userId = req.userId;

  console.log(userId);

  try {
    const user = await Users.findOne({
      where: {
        user_id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else {
      res.json({ user });
    }
  } catch (error) {
    console.error("error fetching user", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/resetPassword", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await Users.findOne({
      where: {
        user_id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentPassword === user.password) {
      const updatePassword = await user.update({
        password: newPassword,
      });

      res.json({ message: "Password updated successfully", updatePassword });
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// app.post('/editProfile', authMiddleware, isAuthenticated, async (req, res) => {
//   const userId = req.session.userId;

//   try {

//     const user = await Users.findByPk(userId);

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

app.post("/addTickets", authMiddleware, upload.any(), async (req, res) => {
  const userId = req.userId;

  try {
    const user = await Users.findOne({
      where: {
        user_id: userId,
      },
    });
    console.log("this is user",user.dataValues.role)
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let customer_name;

    if (user.dataValues.role === "4") {
      customer_name = user.customer_name;
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
  
      const Ticket = await Tickets.create({
        user_id: user.user_id,
        customer_name: customer_name,
        organization_id: user.organization_id,
        company_legal_name: user.company_legal_name,
        ticket_type: req.body.ticket_type,
        priority: req.body.priority,
        status: "Open",
        subject: req.body.subject,
        details: req.body.details,
        role: user.role,
        details_images_url: fileUrls,
      });
  
      res.json({ Ticket });
    } else if (user.dataValues.role === "1") {
      const cus_name = req.body.customer_name;
      console.log("cusname", cus_name)
      const user2 = await Users.findOne({
        where: {
          customer_name: cus_name,
        },
      });
      
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
  
      const Ticket = await Tickets.create({
        user_id: user2.user_id,
        customer_name: cus_name,
        organization_id: user2.organization_id,
        company_legal_name: user2.company_legal_name,
        ticket_type: req.body.ticket_type,
        priority: req.body.priority,
        status: "Open",
        subject: req.body.subject,
        details: req.body.details,
        role: user2.role,
        details_images_url: fileUrls,
      });
  
      res.json({ Ticket });
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    

  } catch (error) {
    console.error("Error adding profile details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.get("/viewAllTickets", authMiddleware, async (req, res) => {
  const userId = req.userId;

  try {
    const user = await Users.findOne({
      where: {
        user_id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else {
      const tickets = await Tickets.findAll({
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
    const user = await Users.findOne({
      where: {
        user_id: userId,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else {
      const ticketDetails = await Tickets.findAll({
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
//     const user = await Users.findByPk(userId)

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }else{
//       const type = req.body.type;

//       const ticketDetails = await Tickets.findAll({
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
app.put(
  "/editTicketDetails/:id",
  authMiddleware,
  upload.any(),
  async (req, res) => {
    const userId = req.userId;
    const ticketId = req.params.id;
    try {
      const user = await Users.findOne({
        where: {
          user_id: userId,
        },
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Fetch current ticket details
      let currentTicket = await Tickets.findByPk(ticketId);
      if (!currentTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Handle file uploads if any
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

      const combinedFileUrls = [
        ...currentTicket.details_images_url,
        ...newFileUrls,
      ];

      // Fetch new company legal name if customer_name is updated
      let newCompanyLegalName = currentTicket.company_legal_name;
      if (req.body.customer_name && req.body.customer_name !== currentTicket.customer_name) {
        const newUser = await Users.findOne({
          where: {
            customer_name: req.body.customer_name,
          },
        });
        if (newUser) {
          newCompanyLegalName = newUser.company_legal_name;
        }
      }

      // Update ticket details
      const updatedTicket = {
        customer_name: req.body.customer_name || currentTicket.customer_name,
        company_legal_name: newCompanyLegalName,
        ticket_type: req.body.ticket_type || currentTicket.ticket_type,
        priority: req.body.priority || currentTicket.priority,
        subject: req.body.subject || currentTicket.subject,
        details: req.body.details || currentTicket.details,
        details_images_url:
          combinedFileUrls.length > 0
            ? combinedFileUrls
            : currentTicket.details_images_url,
      };

      const [rowsUpdated, [updatedTicketDetails]] = await Tickets.update(
        updatedTicket,
        {
          returning: true,
          where: { id: ticketId },
        }
      );

      // event create: fill events table details
      const createEvent = await Events.create({
        user_id: userId,
        ticket_id: ticketId,
        organization_id: user.organization_id,
        company_legal_name: newCompanyLegalName,
        event_by: req.body.customer_name || currentTicket.customer_name,
        event_details: `${req.body.customer_name || currentTicket.customer_name} updated the ticket`,
      });

      res.json({ ticket: updatedTicketDetails, createEvent });
    } catch (error) {
      console.error("Error editing ticket:", error);
      res.status(500).json({ message: "Failed to edit ticket" });
    }
  }
);


// app.put("/deleteTicketImage/:id", authMiddleware, async (req, res) => {
//   const userId = req.userId;
//   const ticketId = req.params.id;
//   try {
//     const user = await Users.findByPk(userId);
//     const currentTicket = await Tickets.findByPk(ticketId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const filetodelete = req.body.index;

//     const ticketDetails = await Tickets.findOne({
//       where: {
//         id: ticketId,
//       },
//     });

//     const deleteimage = await currentTicket.update({
//       details_images_url: "",
//     });

//     res.json({ deleteimage });
//   } catch (error) {
//     console.error("Error editing tickets:", error);
//     res.status(500).json({ message: "Failed to edit ticket" });
//   }
// });

app.post("/deleteTicketImage/:id", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const ticketId = req.params.id;
  const { index } = req.body;

  try {
    const user = await Users.findByPk(userId);

    const currentTicket = await Tickets.findByPk(ticketId);

    console.log("currentTicket", currentTicket);

    let detailsImages = currentTicket.dataValues.details_images_url || [];
    console.log(" askdjkashd", detailsImages);

    if (detailsImages.length > index && index >= 0) {
      detailsImages.splice(index, 1);
    } else {
      throw new Error("Index out of bounds or invalid");
    }

    console.log("image", detailsImages);

    const details_images_url = detailsImages;

    console.log("updateSliceImage", details_images_url);

    await currentTicket.update({ details_images_url });

    res.json({ currentTicket });
  } catch (error) {
    console.error("Error deleting ticket image:", error);
    res.status(500).json({ message: "Failed to delete ticket image" });
  }
});

app.get("/filtertickets", authMiddleware, async (req, res) => {
  const user_id = req.userId;
  const user = await Users.findOne({
    where: {
      user_id: user_id,
    },
  });
  const {
    type,
    priority,
    status,
    page = 1,
    limit = 10,
    search,
    customerName,
  } = req.query;

  const offset = (page - 1) * limit;
  if (user.role === "1") {
    let filter = {};

    if (type && type !== "Type") filter.ticket_type = type;
    if (priority && priority !== "Priority") filter.priority = priority;
    if (status && status !== "Status") filter.status = status;
    if (customerName && customerName != "Customer Name")
      filter.customer_name = customerName;

    if (search) {
      filter[Op.or] = [
        { subject: { [Op.iLike]: `%${search}%` } },
        { status: { [Op.iLike]: `%${search}%` } },
        { ticket_type: { [Op.iLike]: `%${search}%` } },
        { priority: { [Op.iLike]: `%${search}%` } },
        { customer_name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    console.log("Filter Object:", filter);

    try {
      const { count, rows } = await Tickets.findAndCountAll({
        where: filter,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      console.log("Resulting Tickets:", rows);

      res.json({
        tickets: rows,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
      });
    } catch (error) {
      console.error("Error fetching tickets:", error); // Log the error
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  } else {
    let filter = { user_id };
    if (type && type !== "Type") filter.ticket_type = type;
    if (priority && priority !== "Priority") filter.priority = priority;
    if (status && status !== "Status") filter.status = status;

    if (search) {
      filter[Op.or] = [
        { subject: { [Op.iLike]: `%${search}%` } },
        { status: { [Op.iLike]: `%${search}%` } },
        { ticket_type: { [Op.iLike]: `%${search}%` } },
        { priority: { [Op.iLike]: `%${search}%` } },
      ];
    }

    console.log("Filter Object:", filter);

    try {
      const { count, rows } = await Tickets.findAndCountAll({
        where: filter,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      console.log("Resulting Tickets:", rows);

      res.json({
        tickets: rows,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
      });
    } catch (error) {
      console.error("Error fetching tickets:", error); // Log the error
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  }
});

app.get("/deleteTicket/:id", authMiddleware, async (req, res) => {
  const ticketId = req.params.id;
  try {
    const ticket = await Tickets.findByPk(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    await ticket.destroy();

    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {}
});

app.get("/fetchComments/:id", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const ticketId = req.params.id;
  try {
    const ticket = await Comments.findAll({
      where: {
        user_id: userId,
        ticket_id: ticketId,
      },
    });
    res.json({ ticket });
  } catch (error) {}
});

app.get("/superAdminFetchComments/:id", authMiddleware, async (req, res) => {
  const ticketId = req.params.id;
  try {
    const ticket = await Comments.findAll({
      where: {
        ticket_id: ticketId,
      },
    });
    res.json({ ticket });
  } catch (error) {}
});

app.post("/addComment/:id", authMiddleware, upload.any(), async (req, res) => {
  const userId = req.userId;
  const ticketId = req.params.id;

  try {
    const user = await Users.findOne({
      where: {
        user_id: userId,
      },
    });
    const ticketDetails = await Tickets.findByPk(ticketId);

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

    let updatedImagesUrls;
    if (
      ticketDetails.details_images_url &&
      Array.isArray(ticketDetails.details_images_url)
    ) {
      ticketDetails.details_images_url =
        ticketDetails.details_images_url.concat(fileUrls);
    } else {
      ticketDetails.details_images_url = fileUrls;
    }

    await ticketDetails.save();

    const addingCommentDetails = await Comments.create({
      user_id: user.user_id,
      ticket_id: ticketId,
      organization_id: user.organization_id,
      company_legal_name: user.company_legal_name,
      comment_by: user.customer_name,
      comment_description: req.body.comment_description,
    });
    console.log("addingCommentDetails",addingCommentDetails)

    // create event after someone comments on the ticket
    const createEvent = await Events.create({
      user_id: userId,
      ticket_id: ticketId,
      organization_id: user.organization_id,
      company_legal_name: user.company_legal_name,
      event_by: user.customer_name,
      event_details: `${user.customer_name} commented `,
    });

    res.json({ user, ticketDetails, addingCommentDetails, createEvent });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

app.get("/getEventDetails/:id", authMiddleware, async (req, res) => {
  const ticketId = req.params.id;

  try {
    const event = await Events.findAll({
      where: {
        ticket_id: ticketId,
      },
    });

    res.json({ event });
  } catch (error) {
    console.error("cannot find events:", error);
    res.status(500).json({ error: "Failed to find events" });
  }
});

app.post("/sendResetLink", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Users.findOne({
      where: { email: email },
    });

    if (user) {
      const mailOptions = {
        from: "morphine231201@gmail.com",
        to: email,
        subject: "Sending email using Node.js",
        html: `<a href="http://localhost:3000/ResetPassword/${email}">http://localhost:3000/ResetPassword/${email}`,
        text: "easy",
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res.status(500).json({ error: "Failed to send mail" });
        } else {
          console.log("Email sent: " + info.response);
          res.json({ message: "Email sent successfully", user });
        }
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Cannot send mail:", error);
    res.status(500).json({ error: "Failed to send mail" });
  }
});

app.post("/changePassword", async (req, res) => {
  const { email, newPassword } = req.body;
  console.log(email, newPassword);
  try {
    const user = await Users.findOne({where: {email}})
    if (user) {
      await Users.update(
        { password: newPassword },
        { where: { email: email } }
      );
      console.log(user)
      res.json({user});
    }
    
  } catch (error) {
    console.error("cannot reset password:", error);
    res.status(500).json({ error: "failed to reset password" });
  }

});

// Super Admin APIs below:

app.get("/SuperAdminAllTickets", authMiddleware, async (req, res) => {
  try {
    const user = await Tickets.findAll();
    res.json({ user });
    console.log(user);
  } catch (error) {
    es.status(500).json({ message: "Failed to filter tickets" });
  }
});

app.get("/viewAllClients", async (req, res) => {
  try {
    const clients = await Users.findAll({
      where: {
        role: "4",
      },
    });
    res.json({ clients });
  } catch (error) {
    console.error("Error getting client list", error);
    res.status(500).json({ message: "Failed to get client list" });
  }
});
app.post("/addCustomer", async (req, res) => {
  const {
    customer_name,
    company_legal_name,
    company_url,
    phone_number,
    email,
    address,
    city,
    country,
    postal_code,
    about_company,
    work_domain,
  } = req.body;
  try {
    const newCustomer = await Users.create({
      customer_name: customer_name,
      company_legal_name: company_legal_name,
      company_url: company_url,
      phone_number: phone_number,
      email: email,
      password: "Test@123",
      address: address,
      country: country,
      city: city,
      postal_code: postal_code,
      about_company: about_company,
      work_domain: work_domain,
      role: "4",
      onBoarded: false,
    });
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error("Error adding new customer", error);
    res.status(500).json({ message: "Failed to add new customer" });
  }
});
app.put("/updateCustomer", authMiddleware, async (req, res) => {
  const {
    id,
    customer_name,
    company_legal_name,
    company_url,
    phone_number,
    email,
    address,
    city,
    country,
    postal_code,
    about_company,
    work_domain,
  } = req.body;
  try {
    const updatedCustomer = await Users.update(
      {
        customer_name,
        company_legal_name,
        company_url,
        phone_number,
        email,
        address,
        city,
        country,
        postal_code,
        about_company,
        work_domain,
      },
      {
        where: {
          id,
        },
      }
    );
    if (updatedCustomer[0] === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({ message: "Customer updated successfully" });
  } catch (error) {
    console.error("Error updating customer", error);
    res.status(500).json({ message: "Failed to update customer" });
  }
});
// app.delete('/deleteCustomer/:id', authMiddleware, async (req, res) => {
//   const { id } = req.params;
//   try {
//     const deletedCustomer = await Users.destroy({
//       where: {
//         id,
//       },
//     });
//     if (deletedCustomer === 0) {
//       return res.status(404).json({ message: "Customer not found" });
//     }
//     res.status(200).json({ message: "Customer deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting customer", error);
//     res.status(500).json({ message: "Failed to delete customer" });
//   }
// });
app.delete("/deleteCustomer/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await Users.findOne({ where: { id: id } });
    console.log("This is the user", user);
    if (!user) {
      return res.status(404).json({ message: "Customer not found" });
    }
    // if (user.id === req.userId) {
    //   return res.status(403).json({ message: "You cannot delete your own account" });
    // }
    const organization_id = user.organization_id;
    const deleteResult = await Users.destroy({ where: { id: id } });
    if (!deleteResult) {
      return res.status(404).json({ message: "Failed to delete the customer" });
    }
    await Users.destroy({ where: { organization_id: organization_id } });
    res.status(200).json({
      message: "All customers from the organization deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customers:", error);
    res.status(500).json({ message: "Failed to delete customer" });
  }
});
app.post("/getClientTeam", async (req, res) => {
  try {
    const { organization_id } = req.body;
    if (!organization_id) {
      return res.status(400).json({ message: "Organization ID is required" });
    }
    const clientTeam = await Users.findAll({
      where: {
        organization_id: organization_id,
        role: "5",
      },
    });
    res.json({ clientTeam });
  } catch (error) {
    console.error("Error getting client list", error);
    res.status(500).json({ message: "Failed to get client list" });
  }
});
app.post("/addClientTeamMember", async (req, res) => {
  const {
    organization_id,
    customer_name,
    gender,
    company_legal_name,
    // company_url,
    phone_number,
    email,
    designation,
  } = req.body;
  try {
    const newTeamMember = await Users.create({
      organization_id: organization_id,
      customer_name: customer_name,
      gender: gender,
      company_legal_name: company_legal_name,
      // company_url: company_url,
      phone_number: phone_number,
      email: email,
      password: "Test@123",
      designation: designation,
      role: "5",
      onBoarded: "false",
    });
    res
      .status(201)
      .json({ message: "Team member added successfully", newTeamMember });
  } catch (error) {
    console.error("Error adding new team member", error);
    res.status(500).json({ message: "Failed to add team member" });
  }
});
app.delete("/deleteClientTeamMember/:id", async (req, res) => {
  const user_id = req.params.id;
  try {
    const result = await Users.destroy({
      where: { user_id: user_id },
    });
    if (result) {
      res.status(200).json({ message: "Team member deleted successfully" });
    } else {
      res.status(404).json({ message: "Team member not found" });
    }
  } catch (error) {
    console.error("Error deleting team member", error);
    res.status(500).json({ message: "Failed to delete team member" });
  }
});
app.get("/superadmin/details", authMiddleware, async (req, res) => {
  const userId = req.userId;
  console.log("super admin userId", userId);
  try {
    const superAdmin = await Users.findOne({
      where: { user_id: userId, role: "1" },
    });
    console.log("this is the super admin", superAdmin);
    if (!superAdmin) {
      return res.status(404).json({ message: "Super admin not found" });
    }
    res.status(200).json(superAdmin);
  } catch (error) {
    console.error("Error fetching super admin details", error);
    res.status(500).json({ message: "Failed to fetch super admin details" });
  }
});
app.put("/updateSuperAdmin", authMiddleware, async (req, res) => {
  const userId = req.userId;
  console.log("Super Admin being updated, user_id:", userId);
  const {
    customer_name,
    company_legal_name,
    company_url,
    phone_number,
    email,
    address,
    city,
    country,
    postal_code,
    about_company,
    work_domain,
  } = req.body;
  try {
    await Users.update(
      {
        customer_name,
        company_legal_name,
        company_url,
        phone_number,
        email,
        address,
        city,
        country,
        postal_code,
        about_company,
        work_domain,
      },
      {
        where: {
          user_id: userId,
        },
      }
    );
    res.status(200).json({ message: "Super Admin updated successfully" });
  } catch (error) {
    console.error("Error updating super admin:", error);
    res.status(500).json({ message: "Failed to update super admin" });
  }
});
app.get("/users/Organisation", authMiddleware, async (req, res) => {
  const userId = req.userId;
  console.log("this is the superadmins user id", userId);
  try {
    // Get the superadmin's details
    const superAdmin = await Users.findOne({
      where: { user_id: userId, role: "1" },
    });
    if (!superAdmin) {
      return res.status(404).json({ message: "Super admin not found" });
    }
    // Retrieve the organization ID
    const organizationId = superAdmin.organization_id;
    // Fetch all users with the same organization ID
    const users = await Users.findAll({
      where: { organization_id: organizationId },
    });
    if (users.length === 0) {
      return res
        .status(404)
        .json({ message: "No users found for this organization" });
    }
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users for the organization", error);
    res
      .status(500)
      .json({ message: "Failed to fetch users for the organization" });
  }
});
app.post("/addTeamMember", authMiddleware, async (req, res) => {
  const { full_name, gender, department, position, phone_number, email, role } =
    req.body;
  try {
    const loggedInUser = await Users.findOne({
      where: { user_id: req.userId },
    });
    if (!loggedInUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const organizationId = loggedInUser.organization_id;
    let roleId = "3"; // Default role_id
    if (role === "Manager" || role === "Admin") {
      const roleRecord = await Roles.findOne({
        where: { role_name: role.charAt(0).toUpperCase() + role.slice(1) }, // Capitalize the first letter
      });
      if (roleRecord) {
        roleId = roleRecord.role_id;
      }
    }
    const newTeamMember = await Users.create({
      full_name: full_name,
      gender: gender,
      department: department,
      designation: position,
      phone_number: phone_number,
      email: email,
      password: "Test@123", // You may want to change how passwords are handled
      role: roleId, // "manager" or "admin" role_id or default to "3"
      organization_id: organizationId, // Associate with the same organization
      onBoarded: false,
    });
    res.status(201).json(newTeamMember);
  } catch (error) {
    console.error("Error adding new team member", error);
    res.status(500).json({ message: "Failed to add new team member" });
  }
});

// Nirmita's Api's

// app.get("/allTickets", authMiddleware, async (req, res) => {
//   const user_id = req.userId;
//   const { type, priority, status, company_legal_name } = req.query;
//   let where = { user_id };
//   if (priority) {
//     where.priority = priority;
//   }
//   if (status) {
//     where.status = status;
//   }
//   if (type) {
//     where.ticket_type = type;
//   }
//   if (company_legal_name) {
//     where.company_legal_name = { [Op.iLike]: `%${company_legal_name}%` };
//   }
//   try {
//     console.log("Fetching tickets for user ID:", user_id);
//     const tickets = await Tickets.findAll({ where });
//     console.log("tickets", tickets);
//     const response = {
//       success: true,
//       body: tickets,
//       message: "Tickets fetched successfully",
//     };
//     res.json(response);
//     console.log("response", response);
//   } catch (error) {
//     console.error("Error fetching tickets:", error);
//     res.status(500).json({ message: "Failed to fetch tickets" });
//   }
// });


// app.get("/allTickets", authMiddleware, async (req, res) => {
//   const user_id = req.userId;  // Get the logged-in user's ID (the manager's ID)
//   const { type, priority, status, company_legal_name } = req.query;


//   const foundUser =      await Users.findOne({
//     where: { user_id },
//   });

//   isManager = foundUser.role

// // 

// teammember = 




//   try {
//     console.log("Fetching tickets for manager ID:", managerId);

//     // Find all user IDs associated with the managerId from the mappings table
//     // const mappings = await Mapping.findAll({
//     //   where: { manager_id: managerId }
//     // });

//     // Extract user_ids of team members from the mappings
//     const teamMemberIds = mappings.map(mapping => mapping.user_id);

//     // Build where clause for tickets
//     let where = {
//       user_id: { [Op.in]: teamMemberIds }  // Fetch tickets for users in the team
//     };

//     if (priority) {
//       where.priority = priority;
//     }
//     if (status) {
//       where.status = status;
//     }
//     if (type) {
//       where.ticket_type = type;
//     }
//     if (company_legal_name) {
//       where.company_legal_name = { [Op.iLike]: `%${company_legal_name}%` };
//     }

//     const tickets = await Tickets.findAll({ where });

//     console.log("tickets", tickets);
//     const response = {
//       success: true,
//       body: tickets,
//       message: "Tickets fetched successfully",
//     };
//     res.json(response);
//     console.log("response", response);
//   } catch (error) {
//     console.error("Error fetching tickets:", error);
//     res.status(500).json({ message: "Failed to fetch tickets" });
//   }
// });
app.get("/allTickets", authMiddleware, async (req, res) => {
  const user_id = req.userId;  
  const { type, priority, status, company_legal_name } = req.query;

  try {
    const MANAGER_ROLE = "2";  

    console.log("Logged-in user ID:", user_id);

    
    const foundUser = await Users.findOne({
      where: { user_id }  
    });

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Found User:", foundUser);

   
    const isManager = foundUser.role === MANAGER_ROLE;
    console.log("User Role:", foundUser.role, "Is Manager:", isManager);

    const foundTeamMembers = isManager ? await Mapping.findAll({
      where: { manager_id: user_id }  // Ensure 'manager_id' matches the UUID type in your schema
    }) : [];

    if (!foundTeamMembers || foundTeamMembers.length === 0) {
      return res.status(404).json({ message: "No team members found" });
    }

    console.log("Found Team Members:", foundTeamMembers);

    // Extract user_ids of team members
    const teamMemberIds = foundTeamMembers.map(member => member.user_id);
    console.log("Team Member IDs:", teamMemberIds);

    // Build where clause for tickets
    let filter = {
      user_id: { [Op.in]: teamMemberIds }  // Fetch tickets for users in the team
    };

    if (priority) {
      filter.priority = priority;
    }
    if (status) {
      filter.status = status;
    }
    if (type) {
      filter.ticket_type = type;
    }
    if (company_legal_name) {
      filter.company_legal_name = { [Op.iLike]: `%${company_legal_name}%` };
    }

    // Fetch tickets based on the where clause
    const tickets = await Tickets.findAll({ where: filter });

    const response = {
      success: true,
      body: tickets,
      message: "Tickets fetched successfully",
    };
    res.json(response);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});

app.get("/viewTicket/:id", authMiddleware, async (req, res) => {
  const ticketId = req.params.id;
  try {
    const ticketDetails = await Tickets.findAll({
      where: {
        id: ticketId,
      },
    });
    if (!ticketDetails || ticketDetails.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    console.log("tickets", ticketDetails);
    const response = {
      success: true,
      body: ticketDetails,
      message: "Tickets fetched successfully",
    };
    res.json(response);
    console.log("response", response);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});
app.put("/updateProfile", authMiddleware, async (req, res) => {
  const userId = req.userId;
  console.log("Received update request for userId:", userId);
  try {
    const user = await Users.findOne({
      where: {
        user_id: userId,
      },
    });
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }
    await user.update({
      customer_name: req.body.customer_name,
      gender: req.body.gender,
      role: req.body.role,
      position: req.body.position,
      phone_number: req.body.phone_number,
      email: req.body.email,
    });
    res.json({
      updatedUser: user,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.put("/AccountDetails", authMiddleware, async (req, res) => {
  const userId = req.userId;
  console.log("Received update request for userId:", userId);
  try {
    const user = await Users.findOne({
      where: {
        user_id: userId,
      },
    });
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }
    await user.update({
      customer_name: req.body.customer_name,
      gender: req.body.gender,
      role: req.body.role,
      position: req.body.position,
      phone_number: req.body.phone_number,
      email: req.body.email,
    });
    res.json({
      updatedUser: user,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/teamMembers", authMiddleware, async (req, res) => {
  try {
    const customers = await Users.findAll({
      attributes: ["id", "customer_name"],
    });
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customer names:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching customer names." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
