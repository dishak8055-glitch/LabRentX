from users.models import User
from .models import Notification


def notify_user(user, notification_type, message, link=''):
    Notification.objects.create(
        user=user,
        notification_type=notification_type,
        message=message,
        link=link,
    )


def notify_admins(notification_type, message, link=''):
    Notification.objects.bulk_create([
        Notification(
            user=user,
            notification_type=notification_type,
            message=message,
            link=link,
        )
        for user in User.objects.filter(
            role='admin',
            is_active=True,
            is_blocked=False,
        )
    ])
