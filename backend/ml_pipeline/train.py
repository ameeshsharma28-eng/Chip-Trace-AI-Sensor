import os
from ultralytics import YOLO

def train_chip_defect_model(
    data_yaml_path: str = 'dataset/chip_defects.yaml',
    epochs: int = 300,
    img_size: int = 1024,
    batch_size: int = 16
):
    """
    Trains a YOLOv11 Nano model for Oriented Bounding Box (OBB) detection
    to find highly localized semiconductor defects like bent pins or scratches.
    """
    print(f"Starting ML pipeline training on {data_yaml_path}...")
    
    if not os.path.exists(data_yaml_path):
        print(f"ERROR: Dataset configuration {data_yaml_path} not found.")
        print("Please ensure your dataset is mounted and formatted correctly.")
        return None
        
    # Initialize YOLO model suitable for micro-defects
    model = YOLO('yolo11n-obb.pt')
    
    # Run training with semiconductor-specific augmentations
    results = model.train(
        data=data_yaml_path,
        epochs=epochs,
        imgsz=img_size,
        batch=batch_size,
        patience=50, # Early stopping to prevent overfitting
        # Realistic data augmentations for semiconductors
        hsv_h=0.015, hsv_s=0.7, hsv_v=0.4, # Mild lighting variance
        degrees=5.0,  # Small rotations 
        translate=0.1,
        scale=0.1,
        shear=0.0,
        perspective=0.0,
        flipud=0.5, fliplr=0.5, # Safe for symmetrical chips
        mosaic=1.0, # Good for localized micro-defects
        mixup=0.0, # Disabled: unrealistic for physical defects
        project='runs/chip_inspection',
        name='yolo_obb_v1',
        save=True,
        save_period=10
    )
    
    print("Training complete. Best model saved to runs/chip_inspection/yolo_obb_v1/weights/best.pt")
    return results

if __name__ == '__main__':
    train_chip_defect_model()
