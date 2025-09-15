-- Insert sample products for a take-away food business
INSERT INTO products (name, price, category, description, is_active) VALUES
('Hamburguesa Clásica', 8.50, 'Hamburguesas', 'Hamburguesa con carne, lechuga, tomate y queso', true),
('Hamburguesa BBQ', 9.50, 'Hamburguesas', 'Hamburguesa con salsa BBQ, cebolla caramelizada y bacon', true),
('Pizza Margherita', 12.00, 'Pizzas', 'Pizza con tomate, mozzarella y albahaca fresca', true),
('Pizza Pepperoni', 14.00, 'Pizzas', 'Pizza con pepperoni y mozzarella', true),
('Ensalada César', 7.50, 'Ensaladas', 'Ensalada con pollo, lechuga, crutones y aderezo césar', true),
('Papas Fritas', 3.50, 'Acompañamientos', 'Papas fritas crujientes', true),
('Coca Cola', 2.50, 'Bebidas', 'Refresco de cola 500ml', true),
('Agua Mineral', 1.50, 'Bebidas', 'Agua mineral 500ml', true),
('Café Americano', 2.00, 'Bebidas', 'Café americano caliente', true),
('Brownie', 4.00, 'Postres', 'Brownie de chocolate con helado', true);

-- Insert sample inventory for the products
INSERT INTO inventory (product_id, current_stock, min_stock, max_stock, cost_per_unit, user_id)
SELECT 
  p.id,
  CASE 
    WHEN p.category = 'Bebidas' THEN 50
    WHEN p.category = 'Acompañamientos' THEN 30
    ELSE 20
  END as current_stock,
  CASE 
    WHEN p.category = 'Bebidas' THEN 10
    WHEN p.category = 'Acompañamientos' THEN 5
    ELSE 3
  END as min_stock,
  CASE 
    WHEN p.category = 'Bebidas' THEN 100
    WHEN p.category = 'Acompañamientos' THEN 50
    ELSE 30
  END as max_stock,
  p.price * 0.6 as cost_per_unit,
  auth.uid()
FROM products p
WHERE auth.uid() IS NOT NULL;

-- Insert sample expense categories data
INSERT INTO expenses (description, amount, category, date, user_id) VALUES
('Compra de ingredientes', 150.00, 'Ingredientes', CURRENT_DATE - INTERVAL '1 day', auth.uid()),
('Pago de alquiler', 800.00, 'Alquiler', CURRENT_DATE - INTERVAL '2 days', auth.uid()),
('Servicios públicos', 120.00, 'Servicios', CURRENT_DATE - INTERVAL '3 days', auth.uid()),
('Suministros de limpieza', 45.00, 'Suministros', CURRENT_DATE - INTERVAL '4 days', auth.uid())
WHERE auth.uid() IS NOT NULL;
