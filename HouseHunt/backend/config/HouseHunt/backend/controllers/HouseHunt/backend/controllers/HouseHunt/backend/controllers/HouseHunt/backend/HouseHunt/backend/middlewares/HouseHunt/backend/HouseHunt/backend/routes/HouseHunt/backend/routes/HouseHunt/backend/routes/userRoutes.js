const express = require("express");More actions
const authMiddleware = require("../middlewares/authMiddlware");
const multer = require("multer");

const {
  registerController,
  loginController,
  forgotPasswordController,
  authController,
  getAllPropertiesController,
  bookingHandleController,
  getAllBookingsController,
  updateProfileController,
  deleteAccountController,
  updateBookingStatusController,
} = require("../controllers/userController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post("/register", registerController);

router.post("/login", loginController);

router.post("/forgotpassword", forgotPasswordController);

router.get('/getAllProperties', getAllPropertiesController)

router.post("/getuserdata", authMiddleware, authController);

router.put("/updateprofile/:userid", authMiddleware, upload.single("profileImage"), updateProfileController);
router.delete("/deleteaccount/:userid", authMiddleware, deleteAccountController);

router.post("/bookinghandle/:propertyid", authMiddleware, bookingHandleController);

router.get('/getallbookings/:userId', authMiddleware, getAllBookingsController)

router.post('/updatebookingstatus/:bookingId', authMiddleware, updateBookingStatusController);

module.exports = router;
