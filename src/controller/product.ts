const {
  createItem,
  deleteItem,
  updateItem,
  getOneItem,
  getAllItems
} = require( '../common/CRUD/genericCRUD')

export default {
  create: createItem,
  delete: deleteItem,
  update: updateItem,
  getOne: getOneItem,
  getAll: getAllItems
}
