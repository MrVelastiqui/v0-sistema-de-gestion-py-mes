-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update inventory when a sale is made
CREATE OR REPLACE FUNCTION public.update_inventory_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reduce inventory stock when sale item is inserted
  IF TG_OP = 'INSERT' THEN
    UPDATE inventory 
    SET current_stock = current_stock - NEW.quantity,
        last_updated = NOW()
    WHERE product_id = NEW.product_id;
    
    RETURN NEW;
  END IF;
  
  -- Restore inventory stock when sale item is deleted
  IF TG_OP = 'DELETE' THEN
    UPDATE inventory 
    SET current_stock = current_stock + OLD.quantity,
        last_updated = NOW()
    WHERE product_id = OLD.product_id;
    
    RETURN OLD;
  END IF;
  
  -- Handle updates (restore old quantity, subtract new quantity)
  IF TG_OP = 'UPDATE' THEN
    UPDATE inventory 
    SET current_stock = current_stock + OLD.quantity - NEW.quantity,
        last_updated = NOW()
    WHERE product_id = NEW.product_id;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Trigger to automatically update inventory on sale
DROP TRIGGER IF EXISTS on_sale_item_change ON sale_items;
CREATE TRIGGER on_sale_item_change
  AFTER INSERT OR UPDATE OR DELETE ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_sale();
