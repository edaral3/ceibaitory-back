import {
  createItem,
  deleteItem,
  updateItem,
  getOneItem,
  getAllItems
} from '../common/CRUD/genericCRUD'

export default {
  create: createItem,
  delete: deleteItem,
  update: updateItem,
  getOne: getOneItem,
  getAll: getAllItems
}
