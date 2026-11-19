from django.db import models


class Category(models.Model):
    """Equipment category."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Equipment(models.Model):
    """Lab equipment item."""
    CONDITION_CHOICES = (
        ('new', 'New'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('needs_repair', 'Needs Repair'),
    )

    equipment_id = models.CharField(max_length=20, unique=True, editable=False)
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='equipment')
    brand = models.CharField(max_length=100, blank=True)
    model_number = models.CharField(max_length=100, blank=True)
    lab_location = models.CharField(max_length=100)
    image = models.ImageField(upload_to='equipment/', blank=True, null=True)
    description = models.TextField()
    specifications = models.TextField(blank=True)
    datasheet = models.FileField(upload_to='datasheets/', blank=True, null=True)
    total_qty = models.PositiveIntegerField(default=1)
    under_maintenance_qty = models.PositiveIntegerField(default=0)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='good')
    max_rental_days = models.PositiveIntegerField(default=7)
    late_fine_per_day = models.DecimalField(max_digits=8, decimal_places=2, default=50.00)
    unit_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    low_stock_threshold = models.PositiveIntegerField(default=2)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'equipment'
        ordering = ['name']

    def __str__(self):
        return f"{self.equipment_id} - {self.name}"

    def save(self, *args, **kwargs):
        if not self.equipment_id:
            self.equipment_id = self._generate_equipment_id()
        super().save(*args, **kwargs)

    def _generate_equipment_id(self):
        """Generate an ID like ARD-001 from the first 3 chars of the name."""
        prefix = ''.join(c for c in self.name[:3] if c.isalpha()).upper()
        if not prefix:
            prefix = 'EQP'
        last = Equipment.objects.filter(
            equipment_id__startswith=prefix + '-'
        ).order_by('-equipment_id').first()
        if last:
            try:
                num = int(last.equipment_id.split('-')[1]) + 1
            except (IndexError, ValueError):
                num = 1
        else:
            num = 1
        return f"{prefix}-{num:03d}"

    @property
    def issued_qty(self):
        """Count of currently issued items."""
        return self.rental_requests.filter(status='issued').count()

    @property
    def reserved_qty(self):
        """Count of approved-but-not-yet-issued items."""
        return self.rental_requests.filter(status='approved').count()

    @property
    def available_qty(self):
        """Available = total - issued - reserved - under maintenance."""
        return max(0, self.total_qty - self.issued_qty - self.reserved_qty - self.under_maintenance_qty)

    @property
    def is_low_stock(self):
        return self.available_qty <= self.low_stock_threshold
