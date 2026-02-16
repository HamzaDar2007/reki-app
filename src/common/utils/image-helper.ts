import * as fs from 'fs';
import * as path from 'path';

export class ImageHelper {
  private static readonly IMAGE_BASE_PATH = path.join(
    __dirname,
    '..',
    '..',
    'images',
  );
  private static readonly SUPPORTED_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.avif',
  ];

  /**
   * Normalize a venue name for file matching
   * Removes apostrophes, spaces, converts to lowercase
   */
  static normalizeVenueName(name: string): string {
    return name
      .toLowerCase()
      .replace(/'/g, '') // Remove apostrophes
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, ''); // Remove any other special characters
  }

  /**
   * Find matching image file for a venue name in a specific category folder
   */
  static findImageForVenue(venueName: string, category: string): string | null {
    const normalizedName = this.normalizeVenueName(venueName);
    const categoryFolder = this.getCategoryFolder(category);
    const categoryPath = path.join(this.IMAGE_BASE_PATH, categoryFolder);

    if (!fs.existsSync(categoryPath)) {
      return null;
    }

    const files = fs.readdirSync(categoryPath);

    // Try exact match first
    for (const file of files) {
      const fileNameWithoutExt = path.parse(file).name;
      const normalizedFileName = this.normalizeVenueName(fileNameWithoutExt);

      if (normalizedFileName === normalizedName) {
        return `/images/${categoryFolder}/${file}`;
      }
    }

    // Try partial match (file name contains venue name or vice versa)
    for (const file of files) {
      const fileNameWithoutExt = path.parse(file).name;
      const normalizedFileName = this.normalizeVenueName(fileNameWithoutExt);

      if (
        normalizedFileName.includes(normalizedName) ||
        normalizedName.includes(normalizedFileName)
      ) {
        return `/images/${categoryFolder}/${file}`;
      }
    }

    return null;
  }

  /**
   * Find gallery images for a venue (e.g., venue-name-1.jpg, venue-name-2.jpg, etc.)
   */
  static findGalleryImagesForVenue(
    venueName: string,
    category: string,
  ): string[] {
    const categoryFolder = this.getCategoryFolder(category);
    const categoryPath = path.join(this.IMAGE_BASE_PATH, categoryFolder);

    if (!fs.existsSync(categoryPath)) {
      return [];
    }

    const normalizedName = this.normalizeVenueName(venueName);
    const files = fs.readdirSync(categoryPath);
    const galleryImages: string[] = [];

    for (const file of files) {
      const fileNameWithoutExt = path.parse(file).name;
      const normalizedFileName = this.normalizeVenueName(fileNameWithoutExt);

      // Check if file matches pattern: venue-name-1, venue-name-2, etc.
      const galleryPattern = new RegExp(`^${normalizedName}-\\d+$`);
      if (galleryPattern.test(normalizedFileName)) {
        galleryImages.push(`/images/${categoryFolder}/${file}`);
      }
    }

    return galleryImages;
  }

  /**
   * Map venue category to image folder name
   */
  static getCategoryFolder(category: string): string {
    const categoryMap: Record<string, string> = {
      BAR: 'bar',
      CLUB: 'bar', // Clubs are in the bar folder
      RESTAURANT: 'restorantes',
      CASINO: 'casino',
      HOTEL: 'hotels',
    };

    return categoryMap[category.toUpperCase()] || 'bar';
  }

  /**
   * Get all available images in a category
   */
  static getAllImagesInCategory(category: string): string[] {
    const categoryFolder = this.getCategoryFolder(category);
    const categoryPath = path.join(this.IMAGE_BASE_PATH, categoryFolder);

    if (!fs.existsSync(categoryPath)) {
      return [];
    }

    const files = fs.readdirSync(categoryPath);
    return files
      .filter((file) =>
        this.SUPPORTED_EXTENSIONS.includes(path.extname(file).toLowerCase()),
      )
      .map((file) => `/images/${categoryFolder}/${file}`);
  }

  /**
   * Get placeholder image based on category
   */
  static getPlaceholderImage(category: string): string {
    const categoryFolder = this.getCategoryFolder(category);
    return `/images/placeholders/${categoryFolder}-placeholder.jpg`;
  }
}
