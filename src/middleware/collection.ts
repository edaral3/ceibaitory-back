import { getCollection } from "../models";

const setCollection = (collectionName: string) => {
  return (req: any, _res: any, next: any) => {
    //const companyName = req.companyName;
    const companyName = 'test';
    req.CollectionCrud = getCollection(collectionName,companyName);
    switch (collectionName) {
      case "user":
        req.CollectionCompany = getCollection("company", companyName);
        break;
      case "purchase":
        req.CollectionProduct = getCollection("product", companyName);
        req.CollectionPurchase = getCollection(collectionName, companyName);
        break;
      case "sale":
        req.CollectionProduct = getCollection("product", companyName);
        req.CollectionCompany = getCollection("company", companyName);
        req.CollectionSale = getCollection(collectionName, companyName);
        break;
      case "credit":
        req.CollectionProduct = getCollection("product", companyName);
        req.CollectionCompany = getCollection("company", companyName);
        req.CollectionSale = getCollection(collectionName, companyName);
        break;
      case "report":
        req.CollectionProduct = getCollection("product", companyName);
        req.CollectionSale = getCollection(collectionName, companyName);
        break;
    }
    next();
  };
};

export { setCollection };
