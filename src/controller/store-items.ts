import {
  createItem,
  deleteItem,
  updateItem,
  getOneItem,
  getAllItems,
} from "../common/CRUD/genericCRUD";
import { Response } from "express";

type NormalizedItem = {
  productId: string;
  amount: number;
};

class StoreItemValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreItemValidationError";
  }
}

const normalizeId = (value?: any): string => {
  if (!value) {
    return "";
  }
  return typeof value === "string" ? value.trim() : String(value);
};

const parseItemsInput = (items: any): NormalizedItem[] => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new StoreItemValidationError("Debes enviar al menos un item.");
  }
  return items.map((item, index) => {
    const productId = normalizeId(item?.productId ?? item?.product);
    const amount = Number(item?.amount);
    if (!productId) {
      throw new StoreItemValidationError(
        `El item en posición ${index + 1} no tiene productId.`
      );
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new StoreItemValidationError(
        `El item ${productId} debe tener una cantidad mayor a 0.`
      );
    }
    return { productId, amount };
  });
};

const ensureStoreAndProducts = async (
  req: any,
  storeId: string,
  items: NormalizedItem[]
) => {
  const store = await req.CollectionStore.findById(storeId);
  if (!store) {
    throw new StoreItemValidationError("La bodega indicada no existe.");
  }
  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  const products = await req.CollectionProduct.find(
    { _id: { $in: productIds } },
    "name code"
  ).lean();
  const existing = new Map(
    products.map((product: any) => [product._id.toString(), product])
  );
  const missing = productIds.filter((id) => !existing.has(id));
  if (missing.length > 0) {
    throw new StoreItemValidationError(
      `Los siguientes productos no existen: ${missing.join(", ")}`
    );
  }
  return { store, productIds, productsMap: existing };
};

const fetchStoreItems = async (
  CollectionStoreItem: any,
  storeId: string,
  productIds?: string[]
) => {
  const filter: Record<string, any> = { ubication: storeId };
  if (productIds && productIds.length > 0) {
    filter.productId = { $in: productIds };
  }
  return CollectionStoreItem.find(filter)
    .populate(
      "productId",
      "name code barcode salesPrice priceCost existence minExistence"
    )
    .lean();
};

const addItemsBulk = async (req: any, res: Response): Promise<void> => {
  try {
    const storeId = normalizeId(req.body?.storeId);
    const items = parseItemsInput(req.body?.items);
    if (!storeId) {
      throw new StoreItemValidationError(
        "Debes proporcionar el identificador de la bodega."
      );
    }
    const { productIds } = await ensureStoreAndProducts(req, storeId, items);
    const operations = items.map((item) => ({
      updateOne: {
        filter: { ubication: storeId, productId: item.productId },
        update: { $inc: { amount: item.amount } },
        upsert: true,
      },
    }));
    await req.CollectionStoreItem.bulkWrite(operations);
    const updatedItems = await fetchStoreItems(
      req.CollectionStoreItem,
      storeId,
      productIds
    );
    res.send({
      message: "Items agregados a la bodega",
      storeId,
      items: updatedItems,
    });
  } catch (error) {
    if (error instanceof StoreItemValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }
    console.error("[store-items] addItemsBulk", error);
    res.status(500).json({ message: "Error agregando items a la bodega" });
  }
};

const moveItemsToProducts = async (req: any, res: Response): Promise<void> => {
  try {
    const storeId = normalizeId(req.body?.storeId);
    const items = parseItemsInput(req.body?.items);
    if (!storeId) {
      throw new StoreItemValidationError(
        "Debes proporcionar el identificador de la bodega."
      );
    }
    const { productIds } = await ensureStoreAndProducts(req, storeId, items);
    const existingItems = await req.CollectionStoreItem.find({
      ubication: storeId,
      productId: { $in: productIds },
    }).lean();
    const existingMap: Map<string, any> = new Map(
      existingItems.map((item: any) => [item.productId.toString(), item])
    );
    const missing: string[] = [];
    const insufficient: string[] = [];
    items.forEach((item) => {
      const record = existingMap.get(item.productId);
      if (!record) {
        missing.push(item.productId);
        return;
      }
      if (record.amount < item.amount) {
        insufficient.push(
          `${item.productId} (solicitado ${item.amount}, disponible ${record.amount})`
        );
      }
    });
    if (missing.length > 0) {
      throw new StoreItemValidationError(
        `No existe inventario en la bodega para los productos: ${missing.join(
          ", "
        )}`
      );
    }
    if (insufficient.length > 0) {
      throw new StoreItemValidationError(
        `Cantidad insuficiente en bodega para: ${insufficient.join(", ")}`
      );
    }

    for (const item of items) {
      await req.CollectionStoreItem.updateOne(
        { ubication: storeId, productId: item.productId },
        { $inc: { amount: -item.amount } }
      );
      await req.CollectionProduct.findByIdAndUpdate(item.productId, {
        $inc: { existence: item.amount },
      });
    }

    await req.CollectionStoreItem.deleteMany({
      ubication: storeId,
      amount: { $lte: 0 },
    });

    const remainingInStore = await fetchStoreItems(
      req.CollectionStoreItem,
      storeId
    );
    const updatedProducts = await req.CollectionProduct.find(
      { _id: { $in: productIds } },
      "name code existence"
    ).lean();

    res.send({
      message: "Items transferidos al inventario de productos",
      storeId,
      transferred: items,
      remainingInStore,
      updatedProducts,
    });
  } catch (error) {
    if (error instanceof StoreItemValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }
    console.error("[store-items] moveItemsToProducts", error);
    res
      .status(500)
      .json({ message: "Error trasladando los items al inventario" });
  }
};

export default {
  create: createItem,
  delete: deleteItem,
  update: updateItem,
  getOne: getOneItem,
  getAll: getAllItems,
  addItemsBulk,
  moveItemsToProducts,
};
