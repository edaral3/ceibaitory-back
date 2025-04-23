import {
  createItem,
  deleteItem,
  updateItem,
  getOneItem,
  getAllItems
} from '../common/CRUD/genericCRUD.js'

export default {
  create: createItem,
  delete: deleteItem,
  update: updateItem,
  getOne: getOneItem,
  getAll: getAllItems
}
