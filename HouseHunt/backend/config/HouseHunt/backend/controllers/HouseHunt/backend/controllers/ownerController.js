const bookingSchema = require("../schemas/bookingModel");More actions
const propertySchema = require("../schemas/propertyModel");
const userSchema = require("../schemas/userModel");

//////////adding property by owner////////
const addPropertyController = async (req, res) => {
  try {
    let images = [];
    if (req.files) {
      images = req.files.map((file) => ({
        filename: file.filename,
        path: `/uploads/${file.filename}`,
      }));
    }

    const user = await userSchema.findById({ _id: req.body.userId });

    const newPropertyData = new propertySchema({
      ...req.body,
      propertyImage: images,
      ownerId: user._id,
      ownerName: user.name,
      isAvailable: "Available",
    });

    await newPropertyData.save();

    return res.status(200).send({
      success: true,
      message: "New Property has been stored",
    });
  } catch (error) {
    console.log("Error in get All Users Controller ", error);
  }
};

///////////all properties of owner/////////
const getAllOwnerPropertiesController = async (req, res) => {
  const { userId } = req.body;
  try {
    const getAllProperties = await propertySchema.find();
    const updatedProperties = getAllProperties.filter(
      (property) => property.ownerId.toString() === userId
    );
    return res.status(200).send({
      success: true,
      data: updatedProperties,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ message: "Internal server error", success: false });
  }
};

//////delete the property by owner/////
const deletePropertyController = async (req, res) => {
  const propertyId = req.params.propertyid;
  try {
    // First delete all associated bookings using the correct field name 'propertyId'
    await bookingSchema.deleteMany({
      propertyId: propertyId
    });

    // Then delete the property
    await propertySchema.findByIdAndDelete({
      _id: propertyId,
    });

    return res.status(200).send({
      success: true,
      message: "The property and all associated bookings have been deleted",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in deleting the property",
      error,
    });
  }
};

//////updating the property/////////////
const updatePropertyController = async (req, res) => {
  const { propertyid } = req.params;
  console.log(req.body);
  try {
    const property = await propertySchema.findByIdAndUpdate(
      { _id: propertyid },
      {
        ...req.body,
        ownerId: req.body.userId,
      },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      message: "Property updated successfully.",
    });
  } catch (error) {
    console.error("Error updating property:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update property.",
    });
  }
};

const getAllBookingsController = async (req, res) => {
  const { userId } = req.body;
  try {
    const getAllBookings = await bookingSchema.find();
    const updatedBookings = getAllBookings.filter(
      (booking) => booking.ownerID.toString() === userId
    );

    // Create a map to store the most recent booking for each renter-property combination
    const bookingMap = new Map();
    
    // Sort bookings by creation date (newest first)
    updatedBookings.sort((a, b) => b.createdAt - a.createdAt);
    
    // Keep only the most recent booking for each renter-property combination
    updatedBookings.forEach(booking => {
      const key = `${booking.userID}-${booking.propertyId}`;
      if (!bookingMap.has(key)) {
        bookingMap.set(key, booking);
      }
    });

    // Convert map values back to array
    const uniqueBookings = Array.from(bookingMap.values());

    return res.status(200).send({
      success: true,
      data: uniqueBookings,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ message: "Internal server error", success: false });
  }
};

//////////handle bookings status//////////////
const handleAllBookingstatusController = async (req, res) => {
  const { bookingId, propertyId, status } = req.body;
  try {
    // If the booking is being confirmed
    if (status === 'booked') {
      // First, reject all other pending bookings for this property
      await bookingSchema.updateMany(
        { 
          propertyId: propertyId,
          _id: { $ne: bookingId },
          bookingStatus: 'pending'
        },
        { bookingStatus: 'rejected' }
      );
    }

    // Update the selected booking status
    const booking = await bookingSchema.findByIdAndUpdate(
      { _id: bookingId },
      {
        bookingStatus: status,
      },
      {
        new: true,
      }
    );

    // Update property availability
    const property = await propertySchema.findByIdAndUpdate(
      { _id: propertyId },
      {
        isAvailable: status === 'booked' ? 'Unavailable' : 'Available', 
      },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      message: `changed the status of property to ${status}`,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ message: "Internal server error", success: false });
  }
};
module.exports = {
  addPropertyController,
  getAllOwnerPropertiesController,
  deletePropertyController,
  updatePropertyController,
  getAllBookingsController,
  handleAllBookingstatusController,
};
