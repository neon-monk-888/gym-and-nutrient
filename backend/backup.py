#!/usr/bin/env python3
"""
Backup script for Gym & Nutrient Tracker
Creates a timestamped tar archive of the entire /data directory
"""

import os
import tarfile
import shutil
from datetime import datetime
import argparse

def create_backup(output_dir="/tmp", prefix="gym-nutrient-backup"):
    """Create a backup of the data directory"""
    
    # Data directory
    data_dir = "/data"
    
    if not os.path.exists(data_dir):
        print(f"❌ Data directory {data_dir} not found")
        return False
    
    # Create timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"{prefix}_{timestamp}.tar.gz"
    backup_path = os.path.join(output_dir, backup_filename)
    
    try:
        print(f"📦 Creating backup: {backup_path}")
        
        # Create tar archive
        with tarfile.open(backup_path, "w:gz") as tar:
            # Add database file
            db_path = os.path.join(data_dir, "bulkup.db")
            if os.path.exists(db_path):
                tar.add(db_path, arcname="bulkup.db")
                print(f"✅ Added database: {db_path}")
            
            # Add photos directory
            photos_dir = os.path.join(data_dir, "photos")
            if os.path.exists(photos_dir):
                tar.add(photos_dir, arcname="photos")
                photo_count = len(os.listdir(photos_dir)) if os.path.isdir(photos_dir) else 0
                print(f"✅ Added photos directory: {photo_count} files")
        
        # Get file size
        backup_size = os.path.getsize(backup_path)
        size_mb = backup_size / (1024 * 1024)
        
        print(f"✅ Backup created successfully!")
        print(f"📁 File: {backup_path}")
        print(f"💾 Size: {size_mb:.1f} MB")
        
        return True
        
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        return False

def restore_backup(backup_path, target_dir="/data"):
    """Restore from a backup file"""
    
    if not os.path.exists(backup_path):
        print(f"❌ Backup file not found: {backup_path}")
        return False
    
    try:
        print(f"📦 Restoring from: {backup_path}")
        
        # Extract to target directory
        with tarfile.open(backup_path, "r:gz") as tar:
            tar.extractall(path=target_dir)
        
        print(f"✅ Backup restored to: {target_dir}")
        return True
        
    except Exception as e:
        print(f"❌ Restore failed: {e}")
        return False

def list_contents(backup_path):
    """List contents of a backup file"""
    
    if not os.path.exists(backup_path):
        print(f"❌ Backup file not found: {backup_path}")
        return False
    
    try:
        print(f"📋 Contents of {backup_path}:")
        
        with tarfile.open(backup_path, "r:gz") as tar:
            for member in tar.getmembers():
                size_mb = member.size / (1024 * 1024) if member.size > 0 else 0
                print(f"  📄 {member.name} ({size_mb:.1f} MB)")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to list contents: {e}")
        return False

def cleanup_old_backups(backup_dir="/tmp", prefix="gym-nutrient-backup", keep_count=5):
    """Remove old backup files, keeping only the most recent ones"""
    
    try:
        # Find all backup files
        backup_files = []
        for file in os.listdir(backup_dir):
            if file.startswith(prefix) and file.endswith(".tar.gz"):
                file_path = os.path.join(backup_dir, file)
                backup_files.append((file_path, os.path.getmtime(file_path)))
        
        # Sort by modification time (newest first)
        backup_files.sort(key=lambda x: x[1], reverse=True)
        
        # Remove old files
        if len(backup_files) > keep_count:
            files_to_remove = backup_files[keep_count:]
            for file_path, _ in files_to_remove:
                os.remove(file_path)
                print(f"🗑️  Removed old backup: {os.path.basename(file_path)}")
        
        print(f"📁 Keeping {min(len(backup_files), keep_count)} most recent backups")
        return True
        
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backup/restore Gym & Nutrient Tracker data")
    parser.add_argument("action", choices=["backup", "restore", "list", "cleanup"], 
                       help="Action to perform")
    parser.add_argument("--file", "-f", help="Backup file path (for restore/list)")
    parser.add_argument("--output", "-o", default="/tmp", help="Output directory for backups")
    parser.add_argument("--target", "-t", default="/data", help="Target directory for restore")
    parser.add_argument("--keep", "-k", type=int, default=5, help="Number of backups to keep")
    
    args = parser.parse_args()
    
    if args.action == "backup":
        create_backup(args.output)
        cleanup_old_backups(args.output, keep_count=args.keep)
        
    elif args.action == "restore":
        if not args.file:
            print("❌ --file parameter required for restore")
            exit(1)
        restore_backup(args.file, args.target)
        
    elif args.action == "list":
        if not args.file:
            print("❌ --file parameter required for list")
            exit(1)
        list_contents(args.file)
        
    elif args.action == "cleanup":
        cleanup_old_backups(args.output, keep_count=args.keep)