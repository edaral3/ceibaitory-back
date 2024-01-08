import { existValueError } from "./errors";

const createItem = async (req: any, res: any): Promise<any> => {
  try {
    const item = new req.CollectionCrud(req.body);
    const data = await item.save();
    return res.send({
      item: data,
      message: `${req.CollectionCrud.modelName} created`,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      const message = existValueError(Object.keys(error.keyValue)[0]);
      res.status(400).json({ type: "error", message: message });
    } else {
      res
        .status(500)
        .json({ message: `Error creating ${req.CollectionCrud.modelName}` });
    }
  }
};

const deleteItem = async (req: any, res: any): Promise<any> => {
  try {
    await req.CollectionCrud.findByIdAndDelete(req.params.id);
    return res.send(`${req.CollectionCrud.modelName} deleted`);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Error deleting ${req.CollectionCrud.modelName}` });
  }
};

const updateItem = async (req: any, res: any): Promise<any> => {
  try {
    const data = await req.CollectionCrud.findByIdAndUpdate(req.params.id, {
      $set: req.body,
    });
    return res.send({
      item: data,
      message: `${req.CollectionCrud.modelName} updated`,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      const message = existValueError(Object.keys(error.keyValue)[0]);
      res.status(400).json({ type: "error", message: message });
    } else {
      res
        .status(500)
        .json({ message: `Error updating ${req.CollectionCrud.modelName}` });
    }
  }
};

const getOneItem = async (req: any, res: any): Promise<any> => {
  try {
    const item = await req.CollectionCrud.findById(req.params.id);
    return res.send(item);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Error gettin one ${req.CollectionCrud.modelName}` });
  }
};

const getAllItems = async (req: any, res: any): Promise<any> => {
  try {
    let items: any;
    if (req.collectionName === "product") {
      items = await req.CollectionCrud.find().populate("supplier");
    } 
    else if (req.collectionName === "user") {
      items = await req.CollectionCrud.find().populate("branch");
    } else {
      items = await req.CollectionCrud.find();
    }
    return res.send(items);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Error gettin all ${req.CollectionCrud.modelName}` });
  }
};

export { createItem, deleteItem, updateItem, getOneItem, getAllItems };
