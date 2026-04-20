CREATE OR REPLACE FUNCTION manage_manual_sale_status(p_order_id UUID, p_action TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_status TEXT;
    item RECORD;
BEGIN
    SELECT status INTO v_current_status FROM orders WHERE id = p_order_id;
    IF v_current_status IS NULL THEN RETURN 'Orden no encontrada'; END IF;

    IF p_action = 'delivered' THEN
        FOR item IN SELECT product_id, quantity FROM order_items WHERE order_id = p_order_id LOOP
            UPDATE products SET stock = GREATEST(0, stock - item.quantity) WHERE id = item.product_id;
            UPDATE product_variants SET stock = GREATEST(0, stock - item.quantity) WHERE product_id = item.product_id;
        END LOOP;
        UPDATE orders SET status = 'delivered' WHERE id = p_order_id;
        RETURN 'Stock descontado y orden entregada';
    END IF;

    IF p_action = 'returned' THEN
        FOR item IN SELECT product_id, quantity FROM order_items WHERE order_id = p_order_id LOOP
            UPDATE products SET stock = stock + item.quantity WHERE id = item.product_id;
            UPDATE product_variants SET stock = stock + item.quantity WHERE product_id = item.product_id;
        END LOOP;
        UPDATE orders SET status = 'cancelled' WHERE id = p_order_id;
        RETURN 'Stock devuelto y orden cancelada';
    END IF;

    RETURN 'Acción no válida';
END;
$$;
