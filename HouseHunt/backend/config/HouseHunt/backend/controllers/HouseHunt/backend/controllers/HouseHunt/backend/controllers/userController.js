const bcrypt = require("bcryptjs");More actions
const jwt = require("jsonwebtoken");
const userSchema = require("../schemas/userModel");
const propertySchema = require("../schemas/propertyModel");
const bookingSchema = require("../schemas/bookingModel");

//////////for registering/////////////////////////////
const registerController = async (req, res) => {
  try {
    let granted = "";
    const existsUser = await userSchema.findOne({ email: req.body.email });
    if (existsUser) {
      return res
        .status(200)
        .send({ message: "User already exists", success: false });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;

    if (req.body.type === "Owner") {
      granted = "ungranted";
      const newUser = new userSchema({ ...req.body, granted });
      await newUser.save();
    } else {
      const newUser = new userSchema(req.body);
      await newUser.save();
    }

    ///////////aur you can do this////////
    //     if (req.body.type === "Owner") {
    //       newUser.set("granted", "pending", { strict: false });
    //     }
    //////////////////// for this, then you need to remove strict keyword from schema//////////////////////

    return res.status(201).send({ message: "Register Success", success: true });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ success: false, message: `${error.message}` });
  }
};

////for the login
const loginController = async (req, res) => {
  try {
    const user = await userSchema.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(200)
        .send({ message: "User not found", success: false });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res
        .status(200)
        .send({ message: "Invalid email or password", success: false });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_KEY, {
      expiresIn: "1d",
    });
    user.password = undefined;
    return res.status(200).send({
      message: "Login successful",
      success: true,
      token,
      user: user,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ success: false, message: `${error.message}` });
  }
};

/////forgotting password
const forgotPasswordController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const updatedUser = await userSchema.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(200)
        .send({ message: "User not found", success: false });
    }

    await updatedUser.save();
    return res.status(200).send({
      message: "Password changed successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ success: false, message: `${error.message}` });
  }
};

////auth controller
const authController = async (req, res) => {
  console.log(req.body);
  try {
    const user = await userSchema.findOne({ _id: req.body.userId });
    console.log(user);
    if (!user) {
      return res
        .status(200)
        .send({ message: "user not found", success: false });
    } else {
      return res.status(200).send({
        success: true,
        data: user,
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ message: "auth error", success: false, error });
  }
};
/////////get all properties in home
const getAllPropertiesController = async (req, res) => {
  try {
    // Get all properties
    const allProperties = await propertySchema.find({});
    
    // Get all bookings to check availability
    const allBookings = await bookingSchema.find({ bookingStatus: 'booked' });
    
    // Update property availability based on bookings
    const updatedProperties = allProperties.map(property => {
      const isBooked = allBookings.some(booking => 
        booking.propertId.toString() === property._id.toString()
      );
      
      return {
        ...property.toObject(),
        isAvailable: isBooked ? 'Unavailable' : property.isAvailable
      };
    });

    return res.status(200).send({ 
      success: true, 
      data: updatedProperties,
      message: updatedProperties.length === 0 ? "No properties available" : "Properties fetched successfully"
    });
  } catch (error) {
    console.log("Error in getAllPropertiesController:", error);
    return res.status(500).send({ 
      success: false, 
      message: "Error fetching properties",
      error: error.message 
    });
  }
};

///////////booking handle///////////////
const bookingHandleController = async (req, res) => {
  const { propertyid } = req.params;
  const { userDetails, status, userId, ownerId } = req.body;

  try {
    const booking = new bookingSchema({
      propertId: propertyid,
      userID: userId,
      ownerID: ownerId, 
      userName: userDetails.fullName,
      phone: userDetails.phone,
      bookingStatus: status,
    });

    await booking.save();

    return res
      .status(200)
      .send({ success: true, message: "Booking request submitted successfully" });
  } catch (error) {
    console.error("Error handling booking:", error);
    return res
      .status(500)
      .send({ success: false, message: "Error handling booking" });
  }
};

const updateBookingStatusController = async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;

  try {
    const booking = await bookingSchema.findById(bookingId);
    if (!booking) {
      return res.status(404).send({
        success: false,
        message: "Booking not found"
      });
    }

    // Update booking status
    booking.bookingStatus = status;
    await booking.save();

    // If booking is accepted, update property availability
    if (status === 'booked') {
      await propertySchema.findByIdAndUpdate(
        booking.propertId,
        { isAvailable: 'Unavailable' }
      );
    }

    return res.status(200).send({
      success: true,
      message: `Booking ${status} successfully`
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return res.status(500).send({
      success: false,
      message: "Error updating booking status"
    });
  }
};

/////get all bookings for single tenant or owner//////
const getAllBookingsController = async (req, res) => {
  const { userId } = req.params;
  try {
    // Find all bookings where either userID or ownerID matches
    const bookings = await bookingSchema.find({
      $or: [
        { userID: userId },
        { ownerID: userId }
      ]
    }).populate('propertId');

    return res.status(200).send({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Error in getAllBookingsController:", error);
    return res
      .status(500)
      .send({ message: "Internal server error", success: false });
  }
};

const updateProfileController = async (req, res) => {
  const { userid } = req.params;
  try {
    let updateData = { ...req.body };
    
    // Handle profile image if uploaded
    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await userSchema.findByIdAndUpdate(
      { _id: userid },
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).send({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });
  } catch (error) {
    console.log("Error in updateProfileController:", error);
    return res.status(500).send({
      success: false,
      message: "Error updating profile",
      error: error.message
    });
  }
};

const deleteAccountController = async (req, res) => {
  const { userid } = req.params;
  try {
    // Delete user's properties if they are an owner
    await propertySchema.deleteMany({ ownerId: userid });
    
    // Delete user's bookings
    await bookingSchema.deleteMany({ 
      $or: [
        { userID: userid },
        { ownerID: userid }
      ]
    });
    
    // Delete the user account
    const deletedUser = await userSchema.findByIdAndDelete(userid);
    
    if (!deletedUser) {
      return res.status(404).send({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).send({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error) {
    console.log("Error in deleteAccountController:", error);
    return res.status(500).send({
      success: false,
      message: "Error deleting account",
      error: error.message
    });
  }
};

module.exports = {
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
};
