import { getCollection } from "../models";

const setCollection = (collectionName: string) => {
  return (req: any, _res: any, next: any) => {
    req.CollectionCrud = getCollection(collectionName, req.companyName);
    const companyName = req.companyName;
    switch (collectionName) {
      case "user":
        req.CollectionCompany = getCollection("company", companyName);
      case "purchase":
        req.CollectionProduct = getCollection("product", companyName);
        req.CollectionPurchase = getCollection(collectionName, companyName);
      case "sale":
        req.CollectionProduct = getCollection("product", companyName);
        req.CollectionCompany = getCollection("company", companyName);
        req.CollectionSale = getCollection(collectionName, companyName);
      case "credit":
        req.CollectionProduct = getCollection("product", companyName);
        req.CollectionCompany = getCollection("company", companyName);
        req.CollectionSale = getCollection(collectionName, companyName);
      case "report":
        req.CollectionProduct = getCollection("product", companyName);
        req.CollectionSale = getCollection(collectionName, companyName);
    }
    next();
  };
};

export { setCollection };
