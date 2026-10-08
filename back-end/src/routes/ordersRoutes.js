const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');

router.get('/vendedores', ordersController.listVendedores);
router.get('/produtos-form', ordersController.listProdutosForm);
router.get('/anos-vendas', ordersController.listAnosVendas);
router.get('/vendas-por-mes', ordersController.listVendasPorMes);
router.get('/vendas-recentes', ordersController.listVendasRecentes);
router.post('/salvar-venda', ordersController.salvarVenda);
router.get('/leaderboard', ordersController.getLeaderboard);
router.get('/historico', ordersController.getHistorico);

module.exports = router;
