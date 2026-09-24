import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename=fileURLToPath(import.meta.url);const __dirname=path.dirname(__filename);
const DATA=path.join(__dirname,'data');const productsFile=path.join(DATA,'products.json');const ordersFile=path.join(DATA,'orders.json');
const app=express();const PORT=process.env.PORT||8080;
app.use(cors({origin:true,credentials:false}));app.use(express.json());
const read=(file,fallback=[])=>{try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return fallback}};
const write=(file,data)=>fs.writeFileSync(file,JSON.stringify(data,null,2));
const safeProduct = (product) => product ? ({
  id: product.id,
  name: product.name,
  price: product.price,
  category: product.category,
  quantity: product.quantity,
}) : null;

const log=(type,payload={})=>{
  const line={time:new Date().toISOString(),type,...payload};
  console.log(`\n[Thread & Co. API] ${line.time} | ${type}`);
  console.dir(line,{depth:8,colors:true});
};

app.use((req,res,next)=>{
  const start=Date.now();
  console.log(`\n[HTTP →] ${req.method} ${req.originalUrl}`);
  if (req.method !== 'GET' && Object.keys(req.body||{}).length) console.log('[HTTP BODY]', req.body);
  res.on('finish',()=>{
    log('request_complete',{
      method:req.method,
      path:req.originalUrl,
      status:res.statusCode,
      ms:Date.now()-start,
    });
  });
  next();
});

app.get('/api/health',(req,res)=>res.json({ok:true,service:'thread-co-api',time:new Date().toISOString()}));
app.get('/api/product',(req,res)=>{const products=read(productsFile);log('products_list',{count:products.length,products:products.map(safeProduct)});res.json(products)});
app.get('/api/product/:id',(req,res)=>{const p=read(productsFile).find(x=>String(x.id)===String(req.params.id));if(!p){log('product_get_not_found',{productId:req.params.id});return res.status(404).json({message:'Product not found'})}log('product_get',{product:safeProduct(p)});res.json(p)});
app.post('/api/product',(req,res)=>{const products=read(productsFile);const p={id:`p-${Date.now()}`,name:String(req.body.name||'Untitled Product'),price:Number(req.body.price||0),category:req.body.category||'Tops',image:req.body.image||'/images/top.svg',description:req.body.description||''};products.push(p);write(productsFile,products);log('product_create',{action:'Created product',product:safeProduct(p),requestBody:req.body});res.status(201).json(p)});
app.put('/api/product/:id',(req,res)=>{const products=read(productsFile);const idx=products.findIndex(x=>String(x.id)===String(req.params.id));if(idx<0)return res.status(404).json({message:'Product not found'});products[idx]={...products[idx],...req.body,id:products[idx].id,price:Number(req.body.price??products[idx].price)};write(productsFile,products);log('product_update',{action:'Updated product',product:safeProduct(products[idx]),requestBody:req.body});res.json(products[idx])});
app.delete('/api/product/:id',(req,res)=>{const products=read(productsFile);const next=products.filter(x=>String(x.id)!==String(req.params.id));if(next.length===products.length){log('product_delete_not_found',{productId:req.params.id});return res.status(404).json({message:'Product not found'})}const deleted=products.find(x=>String(x.id)===String(req.params.id));write(productsFile,next);log('product_delete',{action:'Deleted product',product:safeProduct(deleted)});res.json({ok:true,product:deleted})});
app.post('/api/order',(req,res)=>{const {customer,items,total,paymentMethod,gcashReference,status}=req.body;if(!customer?.email||!Array.isArray(items)||!items.length)return res.status(400).json({message:'Customer and order items are required'});if(paymentMethod==='GCash'&&!gcashReference)return res.status(400).json({message:'GCash reference number is required'});const orders=read(ordersFile);const order={id:`order-${Date.now()}`,createdAt:new Date().toISOString(),customer,items,total:Number(total||0),paymentMethod,gcashReference:gcashReference||'',status:status||'Processing'};orders.unshift(order);write(ordersFile,orders);log('order_create',{action:'Created order',orderId:order.id,email:customer.email,total:order.total,paymentMethod,items:order.items.map(safeProduct)});res.status(201).json(order)});
app.get('/api/order',(req,res)=>{const email=String(req.query.email||'');const orders=read(ordersFile).filter(o=>o.customer?.email===email);res.json(orders)});
app.get('/api/admin/orders',(req,res)=>{const orders=read(ordersFile);log('admin_orders_list',{count:orders.length,orders:orders.map(o=>({id:o.id,status:o.status,total:o.total,items:(o.items||[]).map(safeProduct)}))});res.json(orders)});
app.put('/api/admin/orders/:id',(req,res)=>{const orders=read(ordersFile);const idx=orders.findIndex(x=>String(x.id)===String(req.params.id));if(idx<0)return res.status(404).json({message:'Order not found'});orders[idx].status=req.body.status||orders[idx].status;write(ordersFile,orders);log('order_status',{action:'Updated order status',orderId:req.params.id,status:orders[idx].status,items:(orders[idx].items||[]).map(safeProduct)});res.json(orders[idx])});
app.post('/api/activity',(req,res)=>{log('client_activity',req.body||{});res.json({ok:true})});
app.use((err,req,res,next)=>{console.error(err);log('error',{message:err.message});res.status(500).json({message:'Server error'})});
app.listen(PORT,()=>log('server_start',{port:PORT}));
