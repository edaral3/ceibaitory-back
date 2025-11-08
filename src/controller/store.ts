import { Response } from "express";

const formatStore = (store: any) =>
  typeof store?.toObject === "function" ? store.toObject() : store;

const toMapKey = (value: any) => value?.toString();

const buildStoreItemsMap = async (
  CollectionStoreItem: any,
  storeIds?: string[]
) => {
  if (!CollectionStoreItem) {
    return new Map<string, any[]>();
  }
  const query =
    storeIds && storeIds.length > 0 ? { ubication: { $in: storeIds } } : {};
  const items = await CollectionStoreItem.find(query)
    .populate("productId", "name code barcode salesPrice priceCost existence")
    .lean();

  const map = new Map<string, any[]>();
  items.forEach((item: any) => {
    const key = toMapKey(item.ubication);
    if (!key) {
      return;
    }
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push({
      _id: item._id,
      amount: item.amount,
      product: item.productId,
    });
  });
  return map;
};

const attachItems = (store: any, itemsMap: Map<string, any[]>) => {
  if (!store) {
    return null;
  }
  const plain = formatStore(store);
  const key = toMapKey(plain?._id);
  return {
    ...plain,
    items: (key && itemsMap.get(key)) ?? [],
  };
};

const handleStoreError = (
  res: Response,
  error: any,
  message: string
): Response => {
  if (error?.code === 11000) {
    return res
      .status(400)
      .json({ message: "Ya existe un registro con los valores enviados." });
  }
  console.error(`[store-controller] ${message}`, error);
  return res.status(500).json({ message });
};

const createStore = async (req: any, res: Response): Promise<void> => {
  try {
    const payload = {
      ubication: req.body?.ubication?.trim(),
    };

    if (!payload.ubication) {
      res
        .status(400)
        .json({ message: "El campo 'ubication' es obligatorio." });
      return;
    }

    const store = await req.CollectionStore.create(payload);
    const itemsMap = await buildStoreItemsMap(
      req.CollectionStoreItem,
      [store._id?.toString()].filter(Boolean)
    );
    res.status(201).send({
      message: "Store created",
      store: attachItems(store, itemsMap),
    });
  } catch (error) {
    handleStoreError(res, error, "Error creando la bodega");
  }
};

const updateStore = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: Record<string, any> = {};
    if (typeof req.body?.ubication === "string") {
      updates.ubication = req.body.ubication.trim();
    }

    const store = await req.CollectionStore.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!store) {
      res.status(404).json({ message: "Store not found" });
      return;
    }

    const itemsMap = await buildStoreItemsMap(
      req.CollectionStoreItem,
      [store._id?.toString()].filter(Boolean)
    );
    res.send({
      message: "Store updated",
      store: attachItems(store, itemsMap),
    });
  } catch (error) {
    handleStoreError(res, error, "Error actualizando la bodega");
  }
};

const deleteStore = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const store = await req.CollectionStore.findById(id);
    if (!store) {
      res.status(404).json({ message: "Store not found" });
      return;
    }

    await req.CollectionStoreItem?.deleteMany({ ubication: id });
    await store.deleteOne();
    res.send({ message: "Store deleted" });
  } catch (error) {
    handleStoreError(res, error, "Error eliminando la bodega");
  }
};

const getStore = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const store = await req.CollectionStore.findById(id).lean();
    if (!store) {
      res.status(404).json({ message: "Store not found" });
      return;
    }

    const itemsMap = await buildStoreItemsMap(
      req.CollectionStoreItem,
      [store._id?.toString()].filter(Boolean)
    );
    res.send(attachItems(store, itemsMap));
  } catch (error) {
    handleStoreError(res, error, "Error obteniendo la bodega");
  }
};

const getStores = async (req: any, res: Response): Promise<void> => {
  try {
    const stores = await req.CollectionStore.find().lean();
    const ids = stores.map((store: any) => store._id?.toString());
    const itemsMap = await buildStoreItemsMap(
      req.CollectionStoreItem,
      ids.filter(Boolean)
    );
    res.send(stores.map((store: any) => attachItems(store, itemsMap)));
  } catch (error) {
    handleStoreError(res, error, "Error obteniendo las bodegas");
  }
};

export default {
  create: createStore,
  update: updateStore,
  delete: deleteStore,
  getOne: getStore,
  getAll: getStores,
};
