const createItem = async (req: any, res: any): Promise<any> => {
  try {
    const item = new req.collectionCrud(req.body);
    await item.save();
    return res.send(`${req.collectionCrud.modelName} created`);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Error creating ${req.collectionCrud.modelName}` });
  }
};

const deleteItem = async (req: any, res: any): Promise<any> => {
  try {
    await req.collectionCrud.findByIdAndDelete(req.params.id);
    return res.send(`${req.collectionCrud.modelName} deleted`);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Error deleting ${req.collectionCrud.modelName}` });
  }
};

const updateItem = async (req: any, res: any): Promise<any> => {
  try {
    await req.collectionCrud.findByIdAndUpdate(req.params.id, { $set: req.body });
    return res.send(`${req.collectionCrud.modelName} updated`);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Error updating ${req.collectionCrud.modelName}` });
  }
};

const getOneItem = async (req: any, res: any): Promise<any> => {
  try {
    const item = await req.collectionCrud.findById(req.params.id);
    return res.send(item);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Error gettin one ${req.collectionCrud.modelName}` });
  }
};

const getAllItems = async (req: any, res: any): Promise<any> => {
  try {
    const items = await req.collectionCrud.find();
    return res.send(items);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Error gettin all ${req.collectionCrud.modelName}` });
  }
};

export { createItem, deleteItem, updateItem, getOneItem, getAllItems };
