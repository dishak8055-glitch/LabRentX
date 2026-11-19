"""
Seed script for LabRentX
Populates realistic lab equipment, categories, Indian students, admin, rental requests, fines, maintenance logs, and notifications.
"""
import os
import django
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from equipment.models import Category, Equipment
from rentals.models import RentalRequest, AuditLog
from fines.models import Fine
from maintenance.models import MaintenanceLog
from notifications.models import Notification


def seed():
    seed_models = (
        Notification,
        MaintenanceLog,
        Fine,
        RentalRequest,
        AuditLog,
        Equipment,
        Category,
        User,
    )
    if any(model.objects.exists() for model in seed_models):
        raise RuntimeError(
            'Refusing to seed a non-empty database. Use an empty, isolated '
            'development database; existing project data was not modified.'
        )

    print("Preparing development demo data...")
    print("Creating users...")
    # Admin / Lab Assistant
    admin = User.objects.create_user(
        username='admin',
        email='labadmin@mitadt.edu.in',
        password='admin123',
        first_name='Suresh',
        last_name='Kulkarni',
        role='admin',
        phone='9822019482',
        class_division='Staff / Lab In-Charge - VLSI & Embedded Lab'
    )
    admin.is_staff = True
    admin.is_superuser = True
    admin.save()

    # Students with realistic Indian names & enrollment numbers
    student1 = User.objects.create_user(
        username='ADT23SOCB0050',
        email='aryan.deshmukh@mitadt.edu.in',
        password='student123',
        first_name='Aryan',
        last_name='Deshmukh',
        role='student',
        enrollment_no='ADT23SOCB0050',
        phone='9890123456',
        class_division='TY B.Tech CSE (AI&ML) - Div B'
    )

    student2 = User.objects.create_user(
        username='ADT23SOCB0014',
        email='tanvi.patil@mitadt.edu.in',
        password='student123',
        first_name='Tanvi',
        last_name='Patil',
        role='student',
        enrollment_no='ADT23SOCB0014',
        phone='9765432190',
        class_division='TY B.Tech CSE (AI&ML) - Div B'
    )

    student3 = User.objects.create_user(
        username='ADT22SOCC0082',
        email='rohan.joshi@mitadt.edu.in',
        password='student123',
        first_name='Rohan',
        last_name='Joshi',
        role='student',
        enrollment_no='ADT22SOCC0082',
        phone='9922883344',
        class_division='Final Year B.Tech ECE - Div A'
    )

    student4 = User.objects.create_user(
        username='ADT23SOCA0025',
        email='ananya.sharma@mitadt.edu.in',
        password='student123',
        first_name='Ananya',
        last_name='Sharma',
        role='student',
        enrollment_no='ADT23SOCA0025',
        phone='9845012789',
        class_division='TY B.Tech Robotics & Automation'
    )

    print("Creating categories...")
    cat_mcu = Category.objects.create(name='Microcontrollers & Development Boards', description='Arduino, ESP32, STM32, and PIC developer evaluation boards')
    cat_test = Category.objects.create(name='Test & Measurement Instruments', description='Digital Storage Oscilloscopes, Signal Generators, Spectrum Analyzers')
    cat_meters = Category.objects.create(name='Digital Multimeters & Meters', description='Benchtop & handheld multimeters, LCR meters, and clamp meters')
    cat_power = Category.objects.create(name='Power Supplies & Loads', description='Variable linear and switching DC regulated power supplies')
    cat_sbc = Category.objects.create(name='Single Board Computers', description='High performance edge compute boards like Raspberry Pi & Jetson')
    cat_tools = Category.objects.create(name='Soldering & Workshop Tools', description='Temperature-controlled soldering stations, desoldering pumps, hot air')

    print("Creating equipment items...")
    eq1 = Equipment.objects.create(
        equipment_id='ARD-014',
        name='Arduino Uno R3 DIP Microcontroller',
        category=cat_mcu,
        brand='Arduino',
        model_number='A000066 Uno R3',
        lab_location='Lab 204 (IoT & Embedded Systems Lab)',
        description='Standard ATmega328P microcontroller prototyping board with 14 digital I/O pins, 6 analog inputs, and 16 MHz quartz crystal.',
        specifications='Operating Voltage: 5V\nFlash Memory: 32 KB\nSRAM: 2 KB\nEEPROM: 1 KB\nClock Speed: 16 MHz\nUSB Connector: Type-B standard',
        total_qty=8,
        under_maintenance_qty=0,
        condition='good',
        max_rental_days=7,
        late_fine_per_day=30.00,
        low_stock_threshold=2,
        is_available=True
    )

    eq2 = Equipment.objects.create(
        equipment_id='RIG-005',
        name='Rigol DS1054Z 50MHz 4-Channel Digital Oscilloscope',
        category=cat_test,
        brand='Rigol Technologies',
        model_number='DS1054Z',
        lab_location='Lab 102 (Analog & Digital Circuits Lab)',
        description='Industry-standard 4-channel digital storage oscilloscope with 1GSa/s real-time sampling rate, 24 Mpts memory depth, and 7-inch WVGA color display.',
        specifications='Bandwidth: 50 MHz (4 Analog Channels)\nReal-time Sample Rate: 1 GSa/s\nMemory Depth: 24 Mpts\nWaveform Capture Rate: up to 30,000 wfms/s\nDisplay: 7-inch TFT LCD (800x480)\nInterfaces: USB Host & Device, LAN (LXI)',
        total_qty=4,
        under_maintenance_qty=0,
        condition='good',
        max_rental_days=3,
        late_fine_per_day=150.00,
        low_stock_threshold=1,
        is_available=True
    )

    eq3 = Equipment.objects.create(
        equipment_id='FLU-008',
        name='Fluke 117 Electrician True RMS Multimeter',
        category=cat_meters,
        brand='Fluke Corporation',
        model_number='Fluke 117',
        lab_location='Lab 105 (Electrical Machines Lab)',
        description='Compact True-RMS meter for demanding commercial applications with non-contact voltage detection (VoltAlert) and low input impedance mode.',
        specifications='AC/DC Voltage: Up to 600V\nAC/DC Current: 10A continuous (20A overload for 30s)\nResistance: 40 MΩ\nCapacitance: 9999 μF\nSafety Rating: CAT III 600 V\nBattery: 9V Alkaline (400 hours)',
        total_qty=6,
        under_maintenance_qty=1,
        condition='good',
        max_rental_days=5,
        late_fine_per_day=60.00,
        low_stock_threshold=2,
        is_available=True
    )

    eq4 = Equipment.objects.create(
        equipment_id='RAS-012',
        name='Raspberry Pi 4 Model B (4GB RAM)',
        category=cat_sbc,
        brand='Raspberry Pi Foundation',
        model_number='Pi 4 Model B 4GB',
        lab_location='Lab 301 (Edge AI & High Performance Computing Lab)',
        description='Quad core 64-bit ARM Cortex-A72 processor @ 1.5GHz, dual-display support at resolutions up to 4K via micro-HDMI, Gigabit Ethernet, and USB 3.0.',
        specifications='SoC: Broadcom BCM2711, Quad core Cortex-A72 64-bit @ 1.5GHz\nRAM: 4GB LPDDR4-3200\nWireless: 2.4/5.0 GHz IEEE 802.11ac, Bluetooth 5.0, BLE\nPorts: 2x USB 3.0, 2x USB 2.0, Gigabit Ethernet, 2x micro-HDMI\nPower: 5V DC via USB-C (minimum 3A)',
        total_qty=5,
        under_maintenance_qty=0,
        condition='new',
        max_rental_days=7,
        late_fine_per_day=80.00,
        low_stock_threshold=2,
        is_available=True
    )

    eq5 = Equipment.objects.create(
        equipment_id='KOR-003',
        name='Korad KD3005D Precision Variable DC Power Supply (30V 5A)',
        category=cat_power,
        brand='Korad Technology',
        model_number='KD3005D',
        lab_location='Lab 102 (Analog & Digital Circuits Lab)',
        description='Digitally regulated DC benchtop linear power supply with low noise, 4-digit LED display for voltage & current, and constant voltage/constant current modes.',
        specifications='Voltage Range: 0 - 30V continuously adjustable\nCurrent Range: 0 - 5A continuously adjustable\nLoad Regulation: <=0.01% +2mV (Voltage), <=0.1% +5mA (Current)\nRipple & Noise: <=1mVrms\nDisplay Accuracy: Voltage 10mV / Current 1mA',
        total_qty=3,
        under_maintenance_qty=0,
        condition='good',
        max_rental_days=4,
        late_fine_per_day=90.00,
        low_stock_threshold=1,
        is_available=True
    )

    eq6 = Equipment.objects.create(
        equipment_id='HAK-002',
        name='Hakko FX-888D Digital ESD-Safe Soldering Station',
        category=cat_tools,
        brand='Hakko Corporation',
        model_number='FX-888D-01BY',
        lab_location='Lab 205 (PCB Fabrication & Soldering Workshop)',
        description='Reliable digital soldering station with selectable preset temperatures, password lock, calibration capability, and thermal recovery design.',
        specifications='Power Consumption: 70W\nTemperature Range: 50°C - 480°C (120°F - 899°F)\nTemperature Stability: +/- 1°C at idle\nTip-to-Ground Resistance: < 2 ohms\nTip-to-Ground Potential: < 2 mV',
        total_qty=4,
        under_maintenance_qty=0,
        condition='good',
        max_rental_days=3,
        late_fine_per_day=50.00,
        low_stock_threshold=1,
        is_available=True
    )

    eq7 = Equipment.objects.create(
        equipment_id='ESP-021',
        name='ESP32-WROOM-32D Dual-Core Wi-Fi & BLE Development Board',
        category=cat_mcu,
        brand='Espressif Systems',
        model_number='NodeMCU-32S ESP-WROOM-32D',
        lab_location='Lab 204 (IoT & Embedded Systems Lab)',
        description='Powerful IoT micro-controller with 240MHz Xtensa dual-core 32-bit LX6 microprocessor, integrated 802.11 b/g/n Wi-Fi, Bluetooth v4.2 BR/EDR and BLE.',
        specifications='CPU: Xtensa dual-core 32-bit LX6 @ 240 MHz\nMemory: 520 KB SRAM, 4 MB external SPI Flash\nPeripherals: Capacitive touch, ADCs, DACs, UART, SPI, I2C, PWM\nUSB-UART: CP2102 chip with Micro-USB interface',
        total_qty=12,
        under_maintenance_qty=0,
        condition='new',
        max_rental_days=7,
        late_fine_per_day=25.00,
        low_stock_threshold=3,
        is_available=True
    )

    eq8 = Equipment.objects.create(
        equipment_id='JET-004',
        name='NVIDIA Jetson Nano Developer Kit B01 (4GB)',
        category=cat_sbc,
        brand='NVIDIA',
        model_number='Jetson Nano B01',
        lab_location='Lab 301 (Edge AI & High Performance Computing Lab)',
        description='Small, powerful computer that lets you run multiple neural networks in parallel for applications like image classification, object detection, and speech processing.',
        specifications='GPU: 128-core Maxwell architecture GPU\nCPU: Quad-core ARM A57 @ 1.43 GHz\nMemory: 4 GB 64-bit LPDDR4 25.6 GB/s\nStorage: microSD (16GB UHS-1 recommended minimum)\nVideo Encode: 4K @ 30 (H.264/H.265)\nCamera: 2x MIPI CSI-2 DPHY lanes',
        total_qty=2,
        under_maintenance_qty=0,
        condition='new',
        max_rental_days=5,
        late_fine_per_day=120.00,
        low_stock_threshold=1,
        is_available=True
    )

    today = timezone.now().date()

    print("Creating rental requests...")
    # 1. Approved request ready for handover at lab counter
    r1 = RentalRequest.objects.create(
        student=student1,
        equipment=eq1,
        num_days=4,
        start_date=today,
        return_date=today + timedelta(days=4),
        reason='Prototyping agricultural soil moisture & automated irrigation node for Final Year Capstone Project evaluation.',
        full_name=student1.get_full_name(),
        enrollment_no=student1.enrollment_no,
        email=student1.email,
        phone=student1.phone,
        class_division=student1.class_division,
        declaration_accepted=True,
        status='approved',
        reservation_code='LRX-48213',
        decided_by=admin,
        decided_at=timezone.now() - timedelta(hours=3),
    )

    # 2. Pending request awaiting admin review
    r2 = RentalRequest.objects.create(
        student=student2,
        equipment=eq4,
        num_days=5,
        start_date=today + timedelta(days=1),
        return_date=today + timedelta(days=6),
        reason='Deploying lightweight computer vision YOLOv8 nano model for smart campus attendance tracking demo.',
        full_name=student2.get_full_name(),
        enrollment_no=student2.enrollment_no,
        email=student2.email,
        phone=student2.phone,
        class_division=student2.class_division,
        declaration_accepted=True,
        status='pending',
    )

    # 3. Issued request (active, due in 2 days)
    r3 = RentalRequest.objects.create(
        student=student3,
        equipment=eq2,
        num_days=3,
        start_date=today - timedelta(days=1),
        return_date=today + timedelta(days=2),
        reason='Analyzing signal jitter and rise times on high-speed SPI transceiver interface for VLSI lab assignment.',
        full_name=student3.get_full_name(),
        enrollment_no=student3.enrollment_no,
        email=student3.email,
        phone=student3.phone,
        class_division=student3.class_division,
        declaration_accepted=True,
        status='issued',
        reservation_code='LRX-39104',
        decided_by=admin,
        decided_at=timezone.now() - timedelta(days=1, hours=2),
        issued_at=timezone.now() - timedelta(days=1),
    )

    # 4. Overdue request (issued 6 days ago for 3 days, overdue by 3 days)
    r4 = RentalRequest.objects.create(
        student=student4,
        equipment=eq3,
        num_days=3,
        start_date=today - timedelta(days=6),
        return_date=today - timedelta(days=3),
        reason='Measuring power consumption transients on robotic arm BLDC servo motors under peak torque load.',
        full_name=student4.get_full_name(),
        enrollment_no=student4.enrollment_no,
        email=student4.email,
        phone=student4.phone,
        class_division=student4.class_division,
        declaration_accepted=True,
        status='issued',
        is_overdue=True,
        reservation_code='LRX-21875',
        decided_by=admin,
        decided_at=timezone.now() - timedelta(days=6, hours=1),
        issued_at=timezone.now() - timedelta(days=6),
    )

    # 5. Returned request (returned with fine)
    r5 = RentalRequest.objects.create(
        student=student1,
        equipment=eq5,
        num_days=2,
        start_date=today - timedelta(days=8),
        return_date=today - timedelta(days=6),
        reason='Testing voltage regulation response of custom Buck Converter circuit under stepped resistive load.',
        full_name=student1.get_full_name(),
        enrollment_no=student1.enrollment_no,
        email=student1.email,
        phone=student1.phone,
        class_division=student1.class_division,
        declaration_accepted=True,
        status='returned',
        reservation_code='LRX-19402',
        decided_by=admin,
        decided_at=timezone.now() - timedelta(days=8, hours=2),
        issued_at=timezone.now() - timedelta(days=8),
        actual_return_date=timezone.now() - timedelta(days=4),  # 2 days late
        return_condition='good',
    )
    # Fine for 2 days late: 2 * 90 = 180
    fine1 = Fine.objects.create(
        rental_request=r5,
        student=student1,
        days_late=2,
        amount=180.00,
        status='unpaid',
    )

    # 6. Rejected request
    r6 = RentalRequest.objects.create(
        student=student3,
        equipment=eq8,
        num_days=5,
        start_date=today - timedelta(days=2),
        return_date=today + timedelta(days=3),
        reason='General hobby testing at home.',
        full_name=student3.get_full_name(),
        enrollment_no=student3.enrollment_no,
        email=student3.email,
        phone=student3.phone,
        class_division=student3.class_division,
        declaration_accepted=True,
        status='rejected',
        admin_remark='Jetson kits are reserved for faculty-supervised Capstone AI projects only. Please submit with guide approval letter.',
        decided_by=admin,
        decided_at=timezone.now() - timedelta(days=2),
    )

    print("Creating maintenance log...")
    MaintenanceLog.objects.create(
        equipment=eq3,
        log_type='damage',
        status='in_progress',
        notes='Current probe fuse blown on 10A input jack during student laboratory session. Replacement fuse ordered.',
        quantity_affected=1,
        logged_by=admin,
    )

    print("Creating notifications...")
    Notification.objects.create(
        user=admin,
        notification_type='request_submitted',
        message=f'New rental request submitted by Tanvi Patil ({student2.enrollment_no}) for Raspberry Pi 4 Model B.',
        is_read=False,
    )
    Notification.objects.create(
        user=student1,
        notification_type='request_approved',
        message='Your request for Arduino Uno R3 DIP has been approved! Use reservation code LRX-48213 to collect it at Lab 204 counter.',
        is_read=False,
    )
    Notification.objects.create(
        user=student4,
        notification_type='overdue',
        message='URGENT: Your rental of Fluke 117 Multimeter was due on ' + str(today - timedelta(days=3)) + '. Please return it to avoid additional late fines.',
        is_read=False,
    )
    Notification.objects.create(
        user=student1,
        notification_type='fine_added',
        message='A late fine of ₹180.00 has been logged for Korad KD3005D DC Power Supply (2 days late). Please clear with lab assistant.',
        is_read=False,
    )

    print("Creating audit logs...")
    AuditLog.objects.create(
        actor=admin,
        action='request_approved',
        target_type='RentalRequest',
        target_id=r1.pk,
        details='Reservation code LRX-48213 generated for Aryan Deshmukh'
    )
    AuditLog.objects.create(
        actor=admin,
        action='equipment_issued',
        target_type='RentalRequest',
        target_id=r3.pk,
        details=f'Equipment: {eq2.name}, Student: {student3.enrollment_no}'
    )

    print("=" * 60)
    print("Development demo data created. Use the local development login helpers.")
    print("These seeded accounts are for isolated development/demo use only.")
    print("=" * 60)


if __name__ == '__main__':
    seed()
